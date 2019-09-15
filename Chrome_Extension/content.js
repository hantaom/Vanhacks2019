// Listen for events from background script
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var display = "Code Smells Detected:" + "\n"
    var len = request.code_smells.length;

    // Loop through smells and display error messages
    if (len > 1) {
      for (var i = 1; i <= len; i++) {
        var smell = request.code_smells[i]
        display = display + i + "." + "type: " + smell.type + "\n"
      }
    }

    // Display Alert
    alert(display);

    sendResponse({action: "Received"});
    console.log("Reached? - content")
  });