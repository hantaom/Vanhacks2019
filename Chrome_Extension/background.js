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

      var strsOfCode = [];
      for(var i = 0; i < linesOfCode.length; i++)
      {
        strsOfCode.push(linesOfCode[i].outerText);
        console.log(linesOfCode[i]);
        console.log("FirstDebug: " + linesOfCode[i].outerText);
      }


//      alert(strsOfCode);
      doParse(strsOfCode);
      chrome.runtime.onConnect.addListener(function(port){
          port.postMessage(message);
      });
      message.result = strsOfCode;
});
function doParse(aCode){
    var aObj = [];
    var iObj = 0;
    for(var iLineNumber = 0; iLineNumber<aCode.length; iLineNumber++){
        var sCode = aCode[iLineNumber];
        // its a comment
        if(sCode.includes("//")) continue;
        if(sCode.includes("console")) continue;
        if(sCode.includes("var")){
            createObj(sCode, aObj, "var", iLineNumber, iObj++);
        }else if(sCode.includes("function")){
            createObj(sCode, aObj, "function", iLineNumber, iObj++);
            findFunctionScope();
        }else if(sCode.includes("const")){
            createObj(sCode, aObj, "const", iLineNumber, iObj++);
        }else{
            updateUsage(sCode, aObj, iLineNumber, iObj);
        }
    }
    //alert(aCode);
    console.log(aObj);
    var json = {"objects":aObj};
    console.log(smell_detector(JSON.stringify(json)));
    alert("HI");
}
function findFunctionScope(){
}
function updateUsage(sCode, aObj, iLineNumber, iObj){
    var aCode = sCode.split(/\s+/);
    for(var iCode=0; iCode<aCode.length; iCode++){
        for(var iObj = 0; iObj<aObj.length; iObj++){
            var oCode = aCode[iCode].split("[")[0];
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
    aUsage[0] = iLineNumber;
    sType = (sType == "var")? "variable":sType;
    sType = (sType == "const")? "constant":sType;

    aObj[iObjCount] = (sType != "function")? new Obj(sName, sType, iLineNumber+1, aUsage, 1): createFunc(sName, sType, iLineNumber+1, aUsage, 1, sCode);
}
function createFunc(sName, sType, iLineNumber, aUsage, iLineCount, sCode){
    var sParam = getParam(sCode, sType);
    return new Func(sName, sType, iLineNumber+1, aUsage, 1, iLineNumber+1, iLineNumber+1, -1, false, sParam);
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
    sName = (sType == "function")? sType.split("(")[0]:sName;
    return sName;
}
function Obj(name, type, declaration, usage, lineNum) {
  this.name = name;
  this.type = type;
  this.declaration = declaration;
  this.usages = usage;
  this.lineCount = lineNum;
}

function Func(name, type, declaration, usage, lineNum, start, end, returnLine, hasCatch, param) {
  Obj.call(this, name, type, declaration, usage, lineNum);

  this.start = start;
  this.end = end;
  this.returnLine = returnLine;
  this.hasCatch = hasCatch;
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