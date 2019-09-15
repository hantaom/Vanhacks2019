// background.js

//parse:
var message = {result: []}

  chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
      // LOG THE CONTENTS HERE
      //console.log(request.content);
      var parser = new DOMParser();
      var htmlDoc = parser.parseFromString(request.content, 'text/html');

     // console.log(htmlDoc);
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

      console.log(arrOfTops);
      //sorted the lines of code:
      var strsOfCode = [];
      for (var i = 0; i < arrOfTops.length; i++)
      {
        for (var j = 0; j < listOfLinesObj.length; j++)
        {
          if (parseInt(listOfLinesObj[j]["top"]) == arrOfTops[i])
          {
            strsOfCode.push(listOfLinesObj[j]["text"]);
          }
        }
      }
      organizeStrs(strsOfCode);
      doParse(strsOfCode);
      chrome.runtime.onConnect.addListener(function(port){
          port.postMessage(message);
      });
      message.result = strsOfCode;
});

function organizeStrs(strsOfCode)
{
  console.log(strsOfCode);
}

function doParse(aCode){
    var aObj = [];
    var iObj = 0;
    for(var i = 0; i<aCode.length; i++){
        var sCode = aCode[i];
        // its a comment
        if(sCode.includes("//")) continue;
        if(sCode.includes("console")) continue;
        if(sCode.includes("var")){
            createVar(sCode, aObj, i, iObj++);
        }else if(sCode.includes("function")){
            createFunction(sCode, aObj, i, iObj++);
        }else if(sCode.includes("const")){
            createConst(sCode, aObj, i, iObj++);
        }else{
            updateUsage(sCode, aObj, i, iObj);
        }
    }
    //alert(aCode);
    console.log(aObj);
    var json = {"objects":aObj};
    console.log(smell_detector(JSON.stringify(json)));
    alert("HI");
}
function updateUsage(sCode, aObj, i, iObj){
    var aCode = sCode.split(/\s+/);
    for(var iCode=0; iCode<aCode.length; iCode++){
        for(var iObj = 0; iObj<aObj.length; iObj++){
            var oCode = aCode[iCode].split("[")[0];
            var oObj = aObj[iObj];
            if(oObj["name"] == oCode){
                var size = oObj.usages.length;
                oObj.usages[size] = i;
            }
        }
    }
}
function createObj(sCode, aObj, sType, iLineNumber, iObjCount){
    var sName = getName(sCode, sType);
    var aUsage = [];
    aUsage[0] = iLineNumber;
    aObj[iObjCount] = new Obj(sName, sType, i, aUsage, 1);
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
    return sName;
}
function createVar(sCode, aObj, i, iObj){
    // standard convention for declaring a variable is
    // var x;
    var aCode = sCode.split(/\s+/);
    var sName = "";
    for(var i=0; i<aCode.length; i++){
        if(i>0 && aCode[i-1] == "var"){
            sName = aCode[i];
            break;
        }
    }
    var aUsage = [];
    aUsage[0] = i;
    aObj[iObj] = new Obj(sName,"variable", i, aUsage, 1);
}
function createConst(sCode, aObj, i, iObj){
    // standard convention for declaring a variable is
    // var x;
    var aCode = sCode.split(/\s+/);
    var sName = "";
    for(var i=0; i<aCode.length; i++){
        if(i>0 && aCode[i-1] == "const"){
            sName = aCode[i];
            break;
        }
    }
    var aUsage = [];
    aUsage[0] = i;
    aObj[iObj] = new Obj(sName,"constant", i, aUsage, 1);
}
function createFunction(sCode, aObj, i, iObj){
    var aCode = sCode.split(/\s+/);
    var sName = "";
    for(var i=0; i<aCode.length; i++){
        if(i>0 && aCode[i-1] == "function"){
            sName = aCode[i];
            break;
        }
    }
    var aUsage = [];
    aUsage[0] = i;
    aObj[iObj] = new Obj(sName,"function", i, aUsage, 1);
}
function Obj(name, type, declaration, usage, lineNum) {
  this.name = name;
  this.type = type;
  this.declaration = declaration;
  this.usages = usage;
  this.lineNum = lineNum;
}

function Func(name, type, declaration, usage, start,end,returnLine,hasCatch,param) {
  Obj.call(name, type, declaration, usage);
  this.start = start;
  this.end = end;
  this.returnLine = returnLine;
  this.hasCatch = hasCatch;
  this.param = param;
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
            if (obj.catch) {
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