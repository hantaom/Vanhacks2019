//This line opens up a long-lived connection to your background page.
var port = chrome.runtime.connect({name:"mycontentscript"});
port.onMessage.addListener(function(message,sender){
  alert(JSON.stringify(message))
});