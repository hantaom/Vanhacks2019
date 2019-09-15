// Listen for events from background script
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    //if from background:
    alert(JSON.stringify(request))
    sendResponse({action: "Received"});
    if (request.code_smells != null){
    var len = request.code_smells.length;

    
    // Loop through smells and display error messages
    if (len > 1) {
      for (var i = 1; i <= len; i++) {
        var smell = request.code_smells[i]
        display = display + i + "." + "type: " + smell.type + "\n"
      }
    }

    //console.log(document.getElementsByClassName("sidebar"));
    //console.log("sidebar?");

    //In order: (Test data)
    cm_test = {
      "code_smells": [
          {
              "type": "unused_code",
              "line": 5
          },
          {
              "type": "large_object",
              "object_size": 25,
              "recommended_size": 20
          }
      ]
  }

    //modifyAlert(cm_test);
    //modifyPopup(cm_test);
    
    chrome.storage.local.set({'cm2': cm_test}, function() {
      console.log( cm_test['code_smells'][0]);
    });

    sendResponse({action: "Received"});
    console.log("Reached? - content");
    
  }
  

        // First, validate the message's structure.
    //if ((msg.from === 'popup') && (msg.subject === 'DOMInfo')) {
      // Collect the necessary data. 
      // (For your specific requirements `document.querySelectorAll(...)`
      //  should be equivalent to jquery's `$(...)`.)

      // Directly respond to the sender (popup), 
      // through the specified callback.

     // response(cm_test);
    //}
    sendResponse({action: "Received"});
  });


function modifyAlert(cs)
{
  console.log("cs");
  console.log(cs);
  
  var display = "";
  display += "Code Smells Detected: " + "\n";

  for (var i = 0; i < cs["code_smells"].length; i++) {
      switch(cs["code_smells"][i]["type"]) {
        case "unused_code":
          display += "- unreachable code detected in line " + cs["code_smells"][i]["line"] + "\n"
          break;
        case "large_object":
          display += "- Large object= " + " of size " + cs["code_smells"][i]["size"] + " detected" + "\n"
          break;
        case "empty_catch":
          display += "- Empty catch detected" + "\n"
          break;
        case "long_method":
        display += "- Long method detected" + "\n"
        break;
        case "excessive_params":
          display += "- Excessive parameters detected" + "\n"
          break;
        case "unreachable_code":
          display += "- Unreachable code detected" + "\n"
          break;
        default:
          break;
          
      }
  }
  display += "*Check out for more info in the above plugin popup!*"
  alert(display);
}

// Inform the background page that 
// this tab should have a page-action.
chrome.runtime.sendMessage({
  from: 'content',
  subject: 'showPageAction',
});

