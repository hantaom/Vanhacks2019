// Listen for events from background script
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    //if from background:
    if (request.code_smells != null){
    var len = request.code_smells.length;

    // Loop through smells and display error messages
    if (len > 1) {
      for (var i = 1; i <= len; i++) {
        var smell = request.code_smells[i]
        display = display + i + "." + "type: " + smell.type + "\n"
      }
    }

    console.log(document.getElementsByClassName("sidebar"));
    console.log("sidebar?");

    //In order: (Test data)
    cm_test =  {
        "type": "unused_code",
        "line": 5
    },
    {
        "type": "large_object",
        "object_size": 25,
        "recommended_size": 20
    }

    modifyAlert(cm_test);
    modifyPopup(cm_test);
    chrome.storage.local.set({cm: {cm_test}}, function() {
      console.log('Value is set to ' + cm_test);
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
      else
      {
      response(cm_test);
      }
    //}
  });


function modifyAlert(cs)
{
  var display = ""
  display += "Code Smells Detected: " + "\n"
    switch(cs["type"]) {
      case "unused_code":
        display += "- unreachable code detected in line " + cs["line"] + "\n"
        break;
      case "large_object":
        display += "- Large object= " + " of size " + cs["size"] + " detected" + "\n"
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
        
    }
    display += "*Check out for more info in the above plugin popup!*"
    alert(display);
}

function modifyPopup(cs)
{
  var x = document.getElementsByClassName("thumb");
  console.log(x);
  for (var x = 0; x < cs.length; i++)
  {
    cs[x].style.display = "none";
  }
  for (var i = 0; i < cs.length; i++)
  {
    switch(cs["type"]) {
      case "unused_code":
        cs[0].style.display = "none";
        break;
      case "large_object":
        cs[1].style.display = "none";
        break;
      case "empty_catch":
        cs[2].style.display = "none";
        break;
      case "long_method":
        cs[3].style.display = "none";
        break;
      case "excessive_params":
        cs[4].style.display = "none";
        break;
      case "unreachable_code":
        cs[5].style.display = "none";
        break;
        
    }
  }
}

// Inform the background page that 
// this tab should have a page-action.
chrome.runtime.sendMessage({
  from: 'content',
  subject: 'showPageAction',
});