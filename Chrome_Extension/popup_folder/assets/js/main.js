/*
	Multiverse by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var	$window = $(window),
		$body = $('body'),
		$wrapper = $('#wrapper');

	// Breakpoints.
		breakpoints({
			xlarge:  [ '1281px',  '1680px' ],
			large:   [ '981px',   '1280px' ],
			medium:  [ '737px',   '980px'  ],
			small:   [ '481px',   '736px'  ],
			xsmall:  [ null,      '480px'  ]
		});

	// Hack: Enable IE workarounds.
		if (browser.name == 'ie')
			$body.addClass('ie');

	// Touch?
		if (browser.mobile)
			$body.addClass('touch');

	// Transitions supported?
		if (browser.canUse('transition')) {

			// Play initial animations on page load.
				$window.on('load', function() {
					window.setTimeout(function() {
						$body.removeClass('is-preload');
					}, 100);
				});

			// Prevent transitions/animations on resize.
				var resizeTimeout;

				$window.on('resize', function() {

					window.clearTimeout(resizeTimeout);

					$body.addClass('is-resizing');

					resizeTimeout = window.setTimeout(function() {
						$body.removeClass('is-resizing');
					}, 100);

				});

		}

	// Scroll back to top.
		$window.scrollTop(0);

	// Panels.
		var $panels = $('.panel');

		$panels.each(function() {

			var $this = $(this),
				$toggles = $('[href="#' + $this.attr('id') + '"]'),
				$closer = $('<div class="closer" />').appendTo($this);

			// Closer.
				$closer
					.on('click', function(event) {
						$this.trigger('---hide');
					});

			// Events.
				$this
					.on('click', function(event) {
						event.stopPropagation();
					})
					.on('---toggle', function() {

						if ($this.hasClass('active'))
							$this.triggerHandler('---hide');
						else
							$this.triggerHandler('---show');

					})
					.on('---show', function() {

						// Hide other content.
							if ($body.hasClass('content-active'))
								$panels.trigger('---hide');

						// Activate content, toggles.
							$this.addClass('active');
							$toggles.addClass('active');

						// Activate body.
							$body.addClass('content-active');

					})
					.on('---hide', function() {

						// Deactivate content, toggles.
							$this.removeClass('active');
							$toggles.removeClass('active');

						// Deactivate body.
							$body.removeClass('content-active');

					});

			// Toggles.
				$toggles
					.removeAttr('href')
					.css('cursor', 'pointer')
					.on('click', function(event) {

						event.preventDefault();
						event.stopPropagation();

						$this.trigger('---toggle');

					});

		});

		// Global events.
			$body
				.on('click', function(event) {

					if ($body.hasClass('content-active')) {

						event.preventDefault();
						event.stopPropagation();

						$panels.trigger('---hide');

					}

				});

			$window
				.on('keyup', function(event) {

					if (event.keyCode == 27
					&&	$body.hasClass('content-active')) {

						event.preventDefault();
						event.stopPropagation();

						$panels.trigger('---hide');

					}

				});

	// Header.
		var $header = $('#header');

		// Links.
			$header.find('a').each(function() {

				var $this = $(this),
					href = $this.attr('href');

				// Internal link? Skip.
					if (!href
					||	href.charAt(0) == '#')
						return;

				// Redirect on click.
					$this
						.removeAttr('href')
						.css('cursor', 'pointer')
						.on('click', function(event) {

							event.preventDefault();
							event.stopPropagation();

							window.location.href = href;

						});

			});

	// Footer.
		var $footer = $('#footer');

		// Copyright.
		// This basically just moves the copyright line to the end of the *last* sibling of its current parent
		// when the "medium" breakpoint activates, and moves it back when it deactivates.
			$footer.find('.copyright').each(function() {

				var $this = $(this),
					$parent = $this.parent(),
					$lastParent = $parent.parent().children().last();

				breakpoints.on('<=medium', function() {
					$this.appendTo($lastParent);
				});

				breakpoints.on('>medium', function() {
					$this.appendTo($parent);
				});

			});

	// Main.
		var $main = $('#main');

		// Thumbs.
			$main.children('.thumb').each(function() {

				var	$this = $(this),
					$image = $this.find('.image'), $image_img = $image.children('img'),
					x;

				// No image? Bail.
					if ($image.length == 0)
						return;

				// Image.
				// This sets the background of the "image" <span> to the image pointed to by its child
				// <img> (which is then hidden). Gives us way more flexibility.

					// Set background.
						$image.css('background-image', 'url(' + $image_img.attr('src') + ')');

					// Set background position.
						if (x = $image_img.data('position'))
							$image.css('background-position', x);

					// Hide original img.
						$image_img.hide();

			});

		// Poptrox.
			$main.poptrox({
				baseZIndex: 20000,
				caption: function($a) {

					var s = '';

					$a.nextAll().each(function() {
						s += this.outerHTML;
					});

					return s;

				},
				fadeSpeed: 300,
				onPopupClose: function() { $body.removeClass('modal-active'); },
				onPopupOpen: function() { $body.addClass('modal-active'); },
				overlayOpacity: 0,
				popupCloserText: '',
				popupHeight: 150,
				popupLoaderText: '',
				popupSpeed: 300,
				popupWidth: 150,
				selector: '.thumb > a.image',
				usePopupCaption: true,
				usePopupCloser: true,
				usePopupDefaultStyling: false,
				usePopupForceClose: true,
				usePopupLoader: true,
				usePopupNav: true,
				windowMargin: 50
			});

			// Hack: Set margins to 0 when 'xsmall' activates.
				breakpoints.on('<=xsmall', function() {
					$main[0]._poptrox.windowMargin = 0;
				});

				breakpoints.on('>xsmall', function() {
					$main[0]._poptrox.windowMargin = 50;
				});
/*
				//test?
				chrome.storage.onChanged.addListener(function(changes, namespace) {
					for (var key in changes) {
					  var storageChange = changes[key];
					  console.log('Storage key "%s" in namespace "%s" changed. ' +
								  'Old value was "%s", new value is "%s".',
								  key,
								  namespace,
								  storageChange.oldValue,
								  storageChange.newValue);
					modifyPopup(changes);
					}
				  });*/
				  
				//test?


				$(document).keypress(function (eventObject) {
					chrome.storage.local.get(['cm'], function(result) {
						console.log('CM Val currently is ' + result);
					  });
				});

				chrome.storage.onChanged.addListener(function(changes, namespace) {
					console.log("changereceived!");
					for (var key in changes) {
					  var storageChange = changes[key];
					  console.log('Storage key "%s" in namespace "%s" changed. ' +
								  'Old value was "%s", new value is "%s".',
								  key,
								  namespace,
								  storageChange.oldValue,
								  storageChange.newValue);
					modifyPopup(changes);
					}
				  });

})(jQuery);

				//test?
				chrome.storage.onChanged.addListener(function(changes, namespace) {
					console.log("changereceived!");
					for (var key in changes) {
					  var storageChange = changes[key];
					  console.log('Storage key "%s" in namespace "%s" changed. ' +
								  'Old value was "%s", new value is "%s".',
								  key,
								  namespace,
								  storageChange.oldValue,
								  storageChange.newValue);
					modifyPopup(changes);
					}
				  });

// Update the relevant fields with the new data.
const setDOMInfo = info => {
	modifyPopup(info);
  };
  
  // Once the DOM is ready...
  chrome.browserAction.onClicked.addListener(function(tab) {
	// ...query for the active tab...
	chrome.tabs.query({
		active: true,
		currentWindow: true
	  }, tabs => {
		// ...and send a request for the DOM info...
		chrome.tabs.sendMessage(
			tabs.id,
			{from: 'popup', subject: 'DOMInfo'},
			// ...also specifying a callback to be called 
			//    from the receiving end (content script).
			setDOMInfo);
	  });
	});

function modifyPopup(cs)
{
  var x = document.getElementsByClassName("thumb");
  console.log(cs);
  for (var n = 0; n < x.length; n++)
  {
	console.log(x[n]);
    x[n].style.display = "none";
  }
  console.log(cs["code_smells"]);
  for (var i = 0; i < cs["code_smells"].length; i++)
  {
    switch(cs["code_smells"][i]["type"]) {
      case "unused_code":
		{
			console.log("yeet");
			x[0].style.display = "none";
			document.getElementsByClassName("unused_code")[0].style.display = "block";
			x[0].getElementsByClassName("line_num")[0].innerHTML  = cs["code_smells"][i]["line"];
		}
        break;
      case "large_object":
		  
        x[1].style.display = "block";
        break;
      case "empty_catch":
        x[2].style.display = "block";
        break;
      case "long_method":
        x[3].style.display = "block";
        break;
      case "excessive_params":
        x[4].style.display = "block";
        break;
      case "unreachable_code":
        x[5].style.display = "block";
        break;
        
    }
  }
}

$(document).keypress(function (eventObject) {
	chrome.storage.local.get(['cm2'], function(result) {
		console.log("result:");
		console.log(result);
		modifyPopup(result['cm2']);

	  });
});