(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'b'], factory);
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports, require('b'));
    } else {
        // Browser globals
        factory((root.commonJsStrict = {}), root.b);
    }
}(this, function (exports, b) {
  var $ = this.jQuery,
      cssPrefixes = ['Webkit', 'Moz', 'ms'],
      emptyStyles = document.createElement('div').style,
      CSS_TRANS_ORG,
      CSS_TRANSFORM,
      CSS_USERSELECT;

  function vendorPrefix(prop) {
    if (prop in emptyStyles) {
        return prop;
    }

    var capProp = prop[0].toUpperCase() + prop.slice(1),
        i = cssPrefixes.length;

    while (i--) {
        prop = cssPrefixes[ i ] + capProp;
        if ( prop in emptyStyles ) {
          return prop;
        }
    }
  }

  CSS_TRANSFORM = vendorPrefix('transform');
  CSS_TRANS_ORG = vendorPrefix('transformOrigin');
  CSS_USERSELECT = vendorPrefix('userSelect');


  function deepExtend (out) {
    out = out || {};

    for (var i = 1; i < arguments.length; i++) {
      var obj = arguments[i];

      if (!obj)
        continue;

      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'object')
            out[key] = deepExtend({}, obj[key]);
          else
            out[key] = obj[key];
        }
      }
    }
    return out;
  }

  function css(el, css, val) {
    if (typeof(css) === 'string') {
      var tmp = css;
      css = {};
      css[tmp] = val;
    }

    for (var prop in css) {
      el.style[prop] = css[prop];
    }
    // var cssText = '';
    // for (prop in css) {
    //   cssText += prop + ': ' + css[prop] + ';';
    // }
    // el.style.cssText = cssText;
  }

  /* Image Drawing Functions */
  function getHtmlImage(data) {
      var coords = data.coords,
          div = document.createElement('div'),
          img = document.createElement('img'),
          width = coords[2] - coords[0],
          height = coords[3] - coords[1],
          scale = data.zoom;

      div.classList.add('croppie-result');
      div.appendChild(img);
      css(img, {
        left: (-1 * coords[0]) + 'px',
        top: (-1 * coords[1]) + 'px'
        // transform: 'scale(' + scale + ')'
      })
      img.src = data.imgSrc;
      css(div, {
        width: width + 'px',
        height: height + 'px'
      });

      return div;
  }

  function getCanvasImage(img, data) {
      var coords = data.coords,
          scale = data.zoom,
          left = coords[0],
          top = coords[1],
          width = (coords[2] - coords[0]),
          height = (coords[3] - coords[1]),
          circle = data.circle,
          canvas = document.createElement('canvas'),
          ctx = canvas.getContext('2d');

      canvas.width = width;
      canvas.height = height;

      if (circle) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
      }

      ctx.drawImage(img, left, top, width, height, 0, 0, width, height);

      return canvas.toDataURL();
  }

  /* Utilities */
  function loadImage (src) {
    var img = new Image(),
        def = $.Deferred();

    img.onload = function () {
      def.resolve(img);
    };
    img.src = src;
    return def.promise();
  }

  function num (v) {
    return parseInt(v, 10);
  }

  /* CSS Transform Prototype */
  var Transform = function (x, y, scale) {
    this.x = parseFloat(x);
    this.y = parseFloat(y);
    this.scale = parseFloat(scale);
  };

  Transform.parse = function (v) {
    if (v.indexOf('matrix') > -1 || v.indexOf('none') > -1) {
      return Transform.fromMatrix(v);
    }
    else {
      return Transform.fromString(v);
    }
  };

  Transform.fromMatrix = function (v) {
    var vals = v.substring(7).split(',');
    if (!vals.length || v === 'none') {
      vals = [1, 0, 0, 1, 0, 0];
    }

    return new Transform(parseInt(vals[4], 10), parseInt(vals[5], 10), parseFloat(vals[0]));
  };

  Transform.fromString = function (v) {
    var values = v.split(') '),
        translate = values[0].substring(10).split(','),
        scale = values.length > 1 ? values[1].substring(6) : 1,
        x = translate.length > 1 ? translate[0] : 0,
        y = translate.length > 1 ? translate[1] : 0;

    return new Transform(x, y, scale);
  }

  Transform.prototype.toString = function () {
    return 'translate(' + this.x + 'px, ' + this.y + 'px) scale(' + this.scale + ')';
  };

  var TransformOrigin = function (el) {
    if (!el || !el.style[CSS_TRANS_ORG]) {
      this.x = 0;
      this.y = 0;
      return;
    }
    var css = el.style[CSS_TRANS_ORG].split(' ');
    this.x = parseFloat(css[0]);
    this.y = parseFloat(css[1]);
  };

  TransformOrigin.prototype.toString = function () {
    return this.x + 'px ' + this.y + 'px';
  };

  /* Private Methods */
  function _create() {
    var self = this,
        contClass = ['croppie-container'],
        boundary = self.boundary = document.createElement('div'),
        viewport = self.viewport = document.createElement('div'),
        img = self.img = document.createElement('img'),
        overlay = self.overlay = document.createElement('div'),
        customViewportClass = self.options.viewport.type ? 'cr-vp-' + self.options.viewport.type : null;

    boundary.classList.add('cr-boundary');
    css(boundary, {
      width: self.options.boundary.width + 'px',
      height: self.options.boundary.height + 'px'
    });

    viewport.classList.add('cr-viewport', customViewportClass);
    css(viewport, {
      width: self.options.viewport.width + 'px',
      height: self.options.viewport.height + 'px'
    });

    img.classList.add('cr-image');
    overlay.classList.add('cr-overlay');

    self.element.appendChild(boundary);
    boundary.appendChild(img);
    boundary.appendChild(viewport);
    boundary.appendChild(overlay);

    self.element.classList.add(contClass, self.options.customClass || null);

    _initDraggable.call(this);

    if (self.options.showZoom) {
      _initializeZoom.call(self);
    }
  }

  function _initializeZoom() {
    var self = this,
        wrap = document.createElement('div'),
        zoomer = self.zoomer = document.createElement('input'),
        origin, 
        viewportRect,
        transform;

    wrap.classList.add('cr-slider-wrap');
    zoomer.type = 'range';
    zoomer.classList.add('cr-slider');
    zoomer.step = '0.01';
    zoomer.value = 1;

    self.element.appendChild(wrap);
    wrap.appendChild(zoomer);

    self._currentZoom = 1;
    function start () {
      _updateCenterPoint.call(self);
      origin = new TransformOrigin(self.img);
      viewportRect = self.viewport.getBoundingClientRect();
      transform = Transform.parse(self.img.style[CSS_TRANSFORM]);
    }

    function change () {
      _onZoom.call(self, {
        value: parseFloat(zoomer.value),
        origin: origin,
        viewportRect: viewportRect || self.viewport.getBoundingClientRect(),
        transform: transform
      });
    }

    function scroll (ev) { 
      var delta = ev.originalEvent.deltaY / -1000,
          targetZoom = self._currentZoom + delta;

      ev.preventDefault();
      start();
      zoomer.value = targetZoom;
      change()      
    }

    $(self.zoomer).on('mousedown.croppie touchstart.croppie', start);
    // this is being fired twice on keypress
    $(self.zoomer).on('input.croppie change.croppie', change);
    
    if (self.options.mouseWheelZoom) {
      $(self.boundary).on('mousewheel.croppie', scroll);
    }
  }

  function _onZoom(ui) {
    var self = this,
        transform = ui.transform,
        vpRect = ui.viewportRect,
        origin = ui.origin;

    self._currentZoom = ui.value;
    transform.scale = self._currentZoom;

    var boundaries = _getVirtualBoundaries.call(self, vpRect),
        transBoundaries = boundaries.translate,
        oBoundaries = boundaries.origin;

    if (transform.x >= transBoundaries.maxX) {
      origin.x = oBoundaries.minX;
      transform.x = transBoundaries.maxX;
    }

    if (transform.x <= transBoundaries.minX) {
      origin.x = oBoundaries.maxX;
      transform.x = transBoundaries.minX;
    }

    if (transform.y >= transBoundaries.maxY) {
      origin.y = oBoundaries.minY;
      transform.y = transBoundaries.maxY;
    }

    if (transform.y <= transBoundaries.minY) {
      origin.y = oBoundaries.maxY;
      transform.y = transBoundaries.minY;
    }

    css(self.img, CSS_TRANS_ORG, origin.toString());
    css(self.img, CSS_TRANSFORM, transform.toString());
    
    _updateOverlay.call(self);
    _triggerUpdate.call(self);
  }

  function _getVirtualBoundaries(viewport) {
    var self = this,
        scale = self._currentZoom,
        vpWidth = viewport.width,
        vpHeight = viewport.height,
        centerFromBoundaryX = self.options.boundary.width / 2,
        centerFromBoundaryY = self.options.boundary.height / 2,
        originalImgWidth = self._originalImageWidth,
        originalImgHeight = self._originalImageHeight,
        curImgWidth = originalImgWidth * scale,
        curImgHeight = originalImgHeight * scale,
        halfWidth = vpWidth / 2,
        halfHeight = vpHeight / 2;


    var maxX = ((halfWidth / scale) - centerFromBoundaryX) * -1;
    var minX = maxX - ((curImgWidth * (1 / scale)) - (vpWidth * (1 / scale)));

    var maxY = ((halfHeight / scale) - centerFromBoundaryY) * -1;
    var minY = maxY - ((curImgHeight * (1 / scale)) - (vpHeight * (1 / scale)));

    var originMinX = (1 / scale) * halfWidth;
    var originMaxX = (curImgWidth * (1 / scale)) - originMinX;

    var originMinY = (1 / scale) * halfHeight;
    var originMaxY = (curImgHeight * (1 / scale)) - originMinY;

    return {
      translate: {
        maxX: maxX,
        minX: minX,
        maxY: maxY,
        minY: minY
      },
      origin: {
        maxX: originMaxX,
        minX: originMinX,
        maxY: originMaxY,
        minY: originMinY
      }
    };
  }

  function _updateCenterPoint() {
    var self = this,
        scale = self._currentZoom,
        data = self.img.getBoundingClientRect(),
        vpData = self.viewport.getBoundingClientRect(),
        transform = Transform.parse(self.img.style[CSS_TRANSFORM]),
        pc = new TransformOrigin(self.img),
        top = (vpData.top - data.top) + (vpData.height / 2),
        left = (vpData.left - data.left) + (vpData.width / 2),
        center = {},
        adj = {};

    center.top = top / scale;
    center.left = left / scale;

    adj.top = (center.top - pc.y) * (1 - scale);
    adj.left = (center.left - pc.x) * (1 - scale);

    transform.x -= adj.left;
    transform.y -= adj.top;
    css(self.img, CSS_TRANS_ORG, center.left + 'px ' + center.top + 'px');
    css(self.img, CSS_TRANSFORM, transform.toString());
  }

  function _initDraggable() {
    var self = this,
        $win = $(window),
        $body = $('body'),
        isDragging = false,
        cssPos = {},
        originalX,
        originalY,
        originalDistance,
        vpRect;

    function mouseDown(ev) {
      ev.preventDefault();
      if (isDragging) return;
      isDragging = true;
      originalX = ev.pageX;
      originalY = ev.pageY;
      transform = Transform.parse($(self.img).css(CSS_TRANSFORM));
      $win.on('mousemove.croppie touchmove.croppie', mouseMove);
      $win.on('mouseup.croppie touchend.croppie', mouseUp);
      $body.css(CSS_USERSELECT, 'none');
      vpRect = self.viewport.getBoundingClientRect();
    }

    function mouseMove (ev) {
      ev.preventDefault();
      var pageX = ev.pageX || ev.originalEvent.touches[0].pageX,
          pageY = ev.pageY || ev.originalEvent.touches[0].pageY,
          deltaX = pageX - originalX,
          deltaY = pageY - originalY,
          imgRect = self.img.getBoundingClientRect(),
          top = transform.y + deltaY,
          left = transform.x + deltaX;

      if (ev.type == 'touchmove') {
        if (ev.originalEvent.touches.length > 1) {
          var e = ev.originalEvent;
          var touch1 = e.touches[0];
          var touch2 = e.touches[1];
          var dist = Math.sqrt((touch1.pageX - touch2.pageX) * (touch1.pageX - touch2.pageX) + (touch1.pageY - touch2.pageY) * (touch1.pageY - touch2.pageY));

          if (!originalDistance) {
            originalDistance = dist / self._currentZoom;
          }

          var scale = dist / originalDistance;

          $(self.zoomer).val(scale).trigger('change');
          return;
        }
      }

      if (vpRect.top > imgRect.top + deltaY && vpRect.bottom < imgRect.bottom + deltaY) {
        transform.y = top;
      }

      if (vpRect.left > imgRect.left + deltaX && vpRect.right < imgRect.right + deltaX) {
        transform.x = left;
      }

      css(self.img, CSS_TRANSFORM, transform.toString());
      _updateOverlay.call(self);
      originalY = pageY;
      originalX = pageX;
    }

    function mouseUp (ev) {
      isDragging = false;
      $win.off('mousemove.croppie mouseup.croppie touchmove.croppie touchend.croppie');
      $body.css(CSS_USERSELECT, '');
      _updateCenterPoint.call(self);
      _triggerUpdate.call(self);
      originalDistance = 0;
    }

    $(self.overlay).on('mousedown.croppie touchstart.croppie', mouseDown);
  }

  function _updateOverlay() {
    var self = this,
        boundRect = self.boundary.getBoundingClientRect(),
        imgData = self.img.getBoundingClientRect();

    css(self.overlay, {
      width: imgData.width + 'px',
      height: imgData.height + 'px',
      top: (imgData.top - boundRect.top) + 'px',
      left: (imgData.left - boundRect.left) + 'px'
    });
  }

  function _triggerUpdate() {
    var self = this;
    self.options.update.apply(self.element, self);
  }

  function _updatePropertiesFromImage() {
    var self = this,
        imgData = self.img.getBoundingClientRect(),
        minZoom = 0,
        maxZoom = 1.5;

    self._originalImageWidth = imgData.width;
    self._originalImageHeight = imgData.height;

    if (self.options.showZoom) {
      minZoom = self.boundary.getBoundingClientRect().width / imgData.width;
      self.zoomer.min = minZoom;
      self.zoomer.max = maxZoom;
      self.zoomer.value = 1;
    }

    _updateOverlay.call(self);
  }

  function _bindPoints(points) {
    if (points.length != 4) {
      throw "Croppie - Invalid number of points supplied";
    }
    var self = this,
        pointsWidth = points[2] - points[0],
        pointsHeight = points[3] - points[1],
        vpData = self.viewport.getBoundingClientRect(),
        boundRect = self.boundary.getBoundingClientRect(),
        vpOffset = {
          left: vpData.left - boundRect.left,
          top: vpData.top - boundRect.top
        },
        scale = vpData.width / pointsWidth,
        originTop = points[1],
        originLeft = points[0],
        transformTop = (-1 * points[1]) + vpOffset.top,
        transformLeft = (-1 * points[0]) + vpOffset.left;

    css(self.img, CSS_TRANS_ORG, originLeft + 'px ' + originTop + 'px');
    css(self.img, CSS_TRANSFORM, new Transform(transformLeft, transformTop, scale).toString());

    self.zoomer.value = scale;
    self._currentZoom = scale;
  }

  function _bind(options, cb) {
    var self = this,
        src,
        points = [];

    if (typeof(options) === 'string') {
      src = options;
      options = {};
    }
    else {
      src = options.src;
      points = options.points;
    }

    self.imgSrc = src;
    var prom = loadImage(src);
    prom.done(function () {
      self.img.src = src;
      _updatePropertiesFromImage.call(self);
      if (points.length) {
        _bindPoints.call(self, points);
      }
      _triggerUpdate.call(self);
      if (cb) {
        cb();
      }
    });
  }

  function _get() {
    var self = this,
        imgSrc = self.img.src,
        imgData = self.img.getBoundingClientRect(),
        vpData = self.viewport.getBoundingClientRect(),
        x1 = vpData.left - imgData.left,
        y1 = vpData.top - imgData.top,
        x2 = x1 + vpData.width,
        y2 = y1 + vpData.height,
        scale = self._currentZoom;

    x1 /= scale;
    x2 /= scale;
    y1 /= scale;
    y2 /= scale;

    return {
      coords: [x1, y1, x2, y2],
      zoom: scale
    };
  }

  function _result(type) {
    var self = this,
        data = _get.call(self),
        def = $.Deferred();

    data.circle = self.options.viewport.type === 'circle';
    data.imgSrc = self.imgSrc;
    type = type || 'html';
    if (type === 'canvas') {
      loadImage(self.imgSrc).done(function (img) {
        def.resolve(getCanvasImage(img, data));
      });
    }
    else {
      def.resolve(getHtmlImage(data));
    }
    return def.promise();
  }
  
  if ($) {
    $.fn.croppie = function (opts) {
      var ot = typeof opts;

      if (ot === 'string') {
        var args = Array.prototype.slice.call(arguments, 1);
        var singleInst = $(this).data('croppie');

        if (opts === 'get') {
          return singleInst.get();
        }
        else if (opts === 'result') {
          return singleInst.result.apply(singleInst, args);
        }

        return this.each(function () {
          var i = $(this).data('croppie');
          if (!i) return;

          var method = i[opts];
          if ($.isFunction(method)) {
            method.apply(i, args);
          }
          else {
            throw 'Croppie ' + opts + ' method not found';
          }
        });
      }
      else {
        return this.each(function () {
          var i = new Croppie(this, opts);
          $(this).data('croppie', i);
        });
      }
    };
  }

  function Croppie(element, opts) {
    this.element = element;
    this.options = deepExtend({}, Croppie.defaults, opts);

    _create.call(this);
  }

  Croppie.defaults = {
    viewport: {
      width: 100,
      height: 100,
      type: 'square'
    },
    boundary: {
      width: 300,
      height: 300
    },
    customClass: '',
    showZoom: true,
    mouseWheelZoom: true,
    update: $.noop
  };

  deepExtend(Croppie.prototype, {
    bind: function (options, cb) {
      return _bind.call(this, options, cb);
    },
    get: function () {
      return _get.call(this);
    },
    result: function (type) {
      return _result.call(this, type);
    }
  });

  exports.croppie = Croppie;
}));