var Demo = (function() {

	function output(html) {
		var existing = $('#result .croppie-result');
		if (existing.length > 0) {
			existing.replaceWith(html);
		}
		else {
			$('#result').append(html);
		}
	}

	function mainCropper () {
		var mc = $('#cropper-1');
		mc.croppie({
			viewport: {
				width: 150,
				height: 150,
				type: 'circle'
			},
			// mouseWheelZoom: false
		});
		mc.croppie('bind', 'demo/demo-1.jpg');
		$('.js-main-image').on('click', function (ev){
            mc.croppie('result', 'canvas').done(function (resp) {
				window.open(resp);
			});
		});
	}

	function demoBasic() {
		var cont = $('#demo-basic').croppie({
			viewport: {
				width: 150,
				height: 200
			},
			update: function (cropper) {
                $(this).croppie('result').done(function(resp) {
                    output(resp);
                });
			}
		});
		cont.croppie('bind', {
			src: 'demo/cat.jpg',
			points: [83.82620873389305,325.71434912743507,273.4365983442827,580.2598036728896]
		});
        //zoom:0.79
	}

	function bindNavigation () {
		var $body = $('body');
		$('nav a').on('click', function (ev) {
			var lnk = $(ev.currentTarget),
				href = lnk.attr('href'),
				targetTop = $('a[name=' + href.substring(1) + ']').offset().top;

			$body.animate({ scrollTop: targetTop });
			ev.preventDefault();
		});
	}

	function init() {
		bindNavigation();
		mainCropper();
		demoBasic();		
	}

	return {
		init: init
	};
})();


// Full version of `log` that:
//  * Prevents errors on console methods when no console present.
//  * Exposes a global 'log' function that preserves line numbering and formatting.
(function () {
  var method;
  var noop = function () { };
  var methods = [
      'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
      'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
      'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
      'timeStamp', 'trace', 'warn'
  ];
  var length = methods.length;
  var console = (window.console = window.console || {});
 
  while (length--) {
    method = methods[length];
 
    // Only stub undefined methods.
    if (!console[method]) {
        console[method] = noop;
    }
  }
 
 
  if (Function.prototype.bind) {
    window.log = Function.prototype.bind.call(console.log, console);
  }
  else {
    window.log = function() { 
      Function.prototype.apply.call(console.log, console, arguments);
    };
  }
})();