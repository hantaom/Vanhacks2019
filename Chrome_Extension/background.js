// background.js

//parse:

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
        console.log("FirstDebug: " + linesOfCode[i].outerText);
      }

//      alert(strsOfCode);
      doParse(strsOfCode);
});
function doParse(aCode){
    var aObj = [];
    var iObj = 0;
    for(var i = 0; i<aCode.length; i++){
        var sCode = aCode[i];
        // its a comment
        if(sCode.includes("//")) continue;
        if(sCode.includes("var")){
            createVar(sCode, aObj, i, iObj++);
        }else if(sCode.includes("function")){
            createFunction(sCode, aObj, i, iObj++);
        }

    }
    alert(aCode);
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
function createFunction(sCode, aObj, i, iObj){
    console.log(iObj);
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
  this.usage = usage;
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