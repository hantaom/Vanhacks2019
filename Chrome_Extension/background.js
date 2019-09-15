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
        console.log("FirstDebug: " + linesOfCode[i].outerText);
      }

      message.result = strsOfCode;

      //UNCOMMENT:
      //doParse(strsOfCode);
    
    });
  
chrome.runtime.onConnect.addListener(function(port){
    port.postMessage(message);
});
    
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
