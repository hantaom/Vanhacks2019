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
        arrOfTops.push(listOfLinesObj[i]["top"]);
      }

      arrOfTops.sort(function(a, b) {return a - b});

      //sorted:
      var strsOfCode = [];
      for (var i = 0; i < arrOfTops.length; i++)
      {
        for (var j = 0; j < listOfLinesObj.length; j++)
        {
          if (listOfLinesObj[j]["top"] == arrOfTops[i])
          {
            strsOfCode.push(listOfLinesObj[j]["text"]);
          }
        }
      }

      doParse(strsOfCode);
      chrome.runtime.onConnect.addListener(function(port){
          port.postMessage(message);
      });
      message.result = strsOfCode;
});
function doParse(aCode){
    var aObj = [];
    var iObj = 0;
    for(var i = 0; i<aCode.length; i++){
        var sCode = aCode[i];
        // its a comment
        if(sCode.includes("//")) continue;
        if(sCode.includes("console")) continue;
        if(sCode.includes("var")){
            console.log("2");
            createVar(sCode, aObj, i, iObj++);
        }else if(sCode.includes("function")){
            createFunction(sCode, aObj, i, iObj++);
        }else if(sCode.includes("const")){
            console.log("1");
            createConst(sCode, aObj, i, iObj++);
        }else{
            console.log("3");
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
    console.log(aCode);
    console.log(aObj.length);

    for(var i=0; i<aCode.length; i++){
        for(var j = 0; j<aObj.length; j++){
            var oCode = aCode[i];
            var oObj = aObj[j];
            console.log("Code: " + oCode);
            console.log(oObj["name"]);

            if(oObj["name"] == oCode){
//                console.log("Code: " + oCode);
//                console.log(oObj);

                var size = oObj.usages.length;
                oObj.usages[++size] = i;
            }
        }
    }
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