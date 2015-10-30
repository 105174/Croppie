var Demo = (function() {

	function output(node) {
		var existing = $('#result .croppie-result');
		if (existing.length > 0) {
			existing[0].parentNode.replaceChild(node, existing[0]);
		}
		else {
			$('#result')[0].appendChild(node);
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
            mc.croppie('result', 'canvas').then(function (resp) {
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
			update: function (data) {
                cont.croppie('result').then(function(resp) {
                    output(resp);
                });
			}
		});
		cont.croppie('bind', {
			url: 'demo/cat.jpg',
			points: [77.38630964949324,469.4327689505912,280.08901235219594,739.7030392208615]
		});
	}

	function demoVanilla() {
		var el = document.getElementById('vanilla-demo');
		var vCrop = new Croppie(el, {
			viewport: { width: 100, height: 100 },
			boundary: { width: 300, height: 300 }
		});
		vCrop.bind('demo/demo-2.jpg');
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
		demoVanilla();	
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