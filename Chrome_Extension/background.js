// background.js

//parse:
var message = {result: []}

  chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
      // LOG THE CONTENTS HERE
      //console.log(request.content);
      var parser = new DOMParser();
      var htmlDoc = parser.parseFromString(request.content, 'text/html');

      console.log(htmlDoc);
      linesOfCode = htmlDoc.getElementsByClassName("view-line");
      var listOfLinesObj = [];
      for (var i = 0; i < linesOfCode.length; i++)
      {
        var key = linesOfCode[i].outerText;
        var strObj = {
          text: linesOfCode[i].outerText,
          top: linesOfCode[i].style.top
        };
        strObj[key] = linesOfCode[i].style.top;
        listOfLinesObj.push(strObj);
        
      }
      
      var arrOfTops = [];
      for (var i = 0; i < listOfLinesObj.length; i++)
      {
        arrOfTops.push(parseInt(listOfLinesObj[i]["top"]));//parse str to int!
      }


      arrOfTops.sort(function(a, b) {return a - b});

      //sorted the lines of code:
      var strsOfCode = [];
      for (var i = 0; i < arrOfTops.length; i++)
      {
        for (var j = 0; j < listOfLinesObj.length; j++)
        {
          if (parseInt(listOfLinesObj[j]["top"]) == arrOfTops[i])
          {
            strsOfCode.push(listOfLinesObj[j]["text"]);
            console.log(strsOfCode[i]);
          }
        }
      }
      organizeStrs(strsOfCode);
      var result = doParse(strsOfCode);
      var message = smell_detector(result);
//      chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
//        chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
//            // Not reached?
//            console.log(response.action);
//        });
//      });
});

function organizeStrs(strsOfCode)
{
  for (var i = 0; i < strsOfCode.length; i++)
  {
        if (strsOfCode[i].includes('{')) {//if char in middle is {
            if (/[^\s\n{]\n*$/.test(strsOfCode[i])) {//if last char not white space, linebreak or {
                var splitStrs = strsOfCode[i].split('{');
                strsOfCode[i] = splitStrs[0] + '{';
                strsOfCode.splice(i + 1, 0, splitStrs[1]);
            }
        }
        else if (strsOfCode[i].includes('}'))
        {
            if (/\S+}/.test(strsOfCode[i])) {//if everything before closing bracket is non-whiteSpace char
                var splitStrs = strsOfCode[i].split('}');
                strsOfCode[i] = splitStrs[0];
                strsOfCode.splice(i + 1, 0, '}');
            }
        }
  }
  console.log(strsOfCode);
}

function doParse(aCode){
    var aObj = [];
    var iObj = 0;
    for(var iLineNumber = 0; iLineNumber<aCode.length; iLineNumber++){
        var sCode = aCode[iLineNumber];
        if(sCode.includes("//")) continue;
        if(sCode.includes("console")) continue;
        if(sCode.includes("var")){
            createObj(sCode, aObj, "var", iLineNumber, iObj++);
        }else if(sCode.includes("function")){
            createObj(sCode, aObj, "function", iLineNumber, iObj++);
            var sName = getName(sCode, "function");
            findFunctionScope(aCode, sName, iLineNumber, aObj);
        }else if(sCode.includes("const")){
            createObj(sCode, aObj, "const", iLineNumber, iObj++);
        }else{
            updateUsage(sCode, aObj, iLineNumber, iObj);
        }
    }
    var json = {"objects":aObj};
    return JSON.stringify(json)
}
function findFunctionScope(aCode, sName, iLineNumber, aObj){
    var oFunc = findObj(aObj, sName);
    var iOpen = 1;
    var iAcc = iLineNumber;

    var returnLine = -1;
    var hasTry = false;
    var validCatch = true;
    while(iAcc++ < aCode.length && iOpen > 0){
        var sCode = aCode[iAcc];
        if(sCode.includes("{")){
            iOpen++;
        }
        if(sCode.includes("return")){
            returnLine = iAcc + 1;
        }
        if(sCode.includes("}")){
            iOpen--;
        }
        if(sCode.includes("try")){
            hasTry = true;
        }
        if(hasTry && sCode.includes("catch")){
            var iEnd = findCatchScope(aCode, iAcc);
            validCatch = validateCatch(aCode, iAcc, iEnd) && validCatch;
            // we can have multiple try catch block
            hasTry = false;
        }
    }
    oFunc["end"] = iAcc;
    oFunc["returnLine"] = returnLine;
    oFunc["validCatch"] = validCatch && !hasTry;
}
function findCatchScope(aCode, iLineNumber){
    var iOpen = 1;
    while(iLineNumber++<aCode.length && iOpen > 0){
        var sCode = aCode[iLineNumber];
        if(sCode.includes("{")){
            iOpen++;
        }
        if(sCode.includes("}")){
            iOpen--;
        }
    }
    return iLineNumber;
}
function validateCatch(aCode, iStart, iEnd){
    var bCatch = false;
    while(++iStart<iEnd-1){
        var sCode = aCode[iStart];
        if(sCode.trim().length >0){
            bCatch = true;
            break;
        }
    }
    return bCatch;
}
function findObj(aObj, sName){
    for(var iIndex = 0; iIndex<aObj.length; iIndex++){
        if(aObj[iIndex]["name"] == sName){
            return aObj[iIndex];
        }
    }
    return null;
}
function updateUsage(sCode, aObj, iLineNumber, iObj){
    sCode = sCode.replace(";","");
    var aCode = sCode.split(/\s+/);
    for(var iCode=0; iCode<aCode.length; iCode++){
        for(var iObj = 0; iObj<aObj.length; iObj++){
            var oCode = aCode[iCode].split("[")[0];
            oCode = aCode[iCode].split("(")[0];
            var oObj = aObj[iObj];
            if(oObj["name"] == oCode){
                var size = oObj.usages.length;
                oObj.usages[size] = iLineNumber+1;
            }
        }
    }
}
function createObj(sCode, aObj, sType, iLineNumber, iObjCount){
    var sName = getName(sCode, sType);
    var aUsage = [];
    aUsage[0] = iLineNumber+1;
    sType = (sType == "var")? "variable":sType;
    sType = (sType == "const")? "constant":sType;
    var iLine = iLineNumber + 1;
    aObj[iObjCount] = (sType != "function")? new Obj(sName, sType, iLine, aUsage, 1): createFunc(sName, sType, iLine, aUsage, 1, sCode);
}
function createFunc(sName, sType, iLineNumber, aUsage, iLineCount, sCode){
    var sParam = getParam(sCode, sType);
    return new Func(sName, sType, iLineNumber, aUsage, 1, iLineNumber, iLineNumber, -1, false, sParam);
}

function getParam(sCode, sType){
    if(sType == "function"){
        var searchTerm = "(";
        var iOpen = sCode.indexOf(searchTerm);
        var iClose = sCode.indexOf(")");

        return sCode.substring(iOpen+1, iClose);
    }
    return "";
}

function getName(sCode, sType){
    var aCode = sCode.split(/\s+/);
    var sName = "";
    for(var i=0; i<aCode.length; i++){
        if(i>0 && aCode[i-1] == sType){
            sName = aCode[i];
            break;
        }
    }
    sName = (sType == "function")? sName.split("(")[0]:sName;
    return sName;
}
function Obj(name, type, declaration, usage, lineNum) {
  this.name = name;
  this.type = type;
  this.declaration = declaration;
  this.usages = usage;
  this.lineCount = lineNum;
}

function Func(name, type, declaration, usage, lineNum, start, end, returnLine, validCatch, param) {
  Obj.call(this, name, type, declaration, usage, lineNum);

  this.start = start;
  this.end = end;
  this.returnLine = returnLine;
  this.validCatch = validCatch;
  this.params = param;
}

Func.prototype = Object.create(Obj.prototype);
Func.prototype.constructor = Func;

function smell_detector(json) {
    // TODO: constant
    // Convert json encoding to json object
    var parsed = JSON.parse(json);
    var result = {code_smells: []};

    // Loop through all existing objects
    for (var i = 0; i < parsed.objects.length; i++) {
        var obj = parsed.objects[i];
        var smells = [];
        // Handle cases where object is either variable or function
        if (obj.type == 'variable') {
            // Handle code smells related to variables
            // 1) Unused code
            if (obj.usages.length <= 1) {
                var unused_code = {type: "unused_code", line: obj.usages[0]}
                smells.push(unused_code);
            }
        } else if (obj.type == 'function') {
            // Handle code smells related to function
            // 2) Large objects: LOC > 20 or NOP > 5
            var size = obj.funcEnd - obj.funcStart;
            if (size > 20 || obj.params.length > 5) {
                var large_obj = {type: "large_object", object_size: size, recommended_size: 20}
                smells.push(large_obj);
            }
            // 3) Empty Catch: Catch statement does not contain any lines to execute
            if (obj.validCatch) {
                var empty_catch = {type: "empty_catch", line: obj.funcStart}
                smells.push(empty_catch);
            }
            // 4) Long Method/Function: Function size > 20
            if (size > 20) {
                var long_method = {type: "long_method", object_size: size, recommended_size: 20}
                smells.push(long_method);
            }
            // 5) Long Parameter List: Number of parameters > 3
            if (obj.params.length > 3) {
                var excessive_params = {type: "excessive_params", current_num: obj.params.length, recommended_num: 3}
                smells.push(excessive_params);
            }
            // 6) Unreachable code: Checks whether there is code after the return statement
            var gapSize = obj.funcEnd - obj.returnLine;
            if (obj.returnLine < obj.funcStart || obj.returnLine > obj.funcEnd || gapSize >= 2) {
                var unreachable_code = {type: "unreachable_code", gap_size: gapSize}
                smells.push(unreachable_code);
            }
        } else {
            console.log("ERROR: Invalid object type")
        }
        result.code_smells.push(smells);
    }
    return result;
  }

chrome.commands.onCommand.addListener(function(command) {
  if (command === "check-codesmell") {

  chrome.tabs.getSelected(null, function(tab) {
    // Now inject a script onto the page
    chrome.tabs.executeScript(tab.id, {
         code: "chrome.extension.sendRequest({content: document.body.innerHTML}, function(response) { console.log('success'); });"
       }, function() { console.log('done'); });
  
  });
}
});