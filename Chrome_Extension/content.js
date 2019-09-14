
// content.js
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if( request.message === "clicked_browser_action" ) {
        var firstHref = $("a[href^='http']").eq(0).attr("href");
  
        console.log(firstHref);
  
        // This line is new!
        chrome.runtime.sendMessage({"message": "open_new_tab", "url": firstHref});
      }

      alert("Hiii");
    }
  );

  chrome.commands.onCommand.addListener(function(command) {
    if (command === "check-codesmell") {
      alert("check-codesmell!");
  } 
});

//Manifest.json:
    /*
    "content_scripts": [
      {
        "matches": [
          "<all_urls>"
        ],
        "js": ["jquery-3.4.1.min.js", "content.js"]
      }
    ],*/