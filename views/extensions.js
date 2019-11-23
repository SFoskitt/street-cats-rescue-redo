/**
 * Concatenates the values of a variable into an easily readable string
 * by Matt Hackett [scriptnode.com]
 * @param {Object} x The variable to debug
 * @param {Number} max The maximum number of recursions allowed (keep low, around 5 for HTML elements to prevent errors) [default: 10]
 * @param {String} sep The separator to use between [default: a single space ' ']
 * @param {Number} l The current level deep (amount of recursion). Do not use this parameter: it's for the function's own use
 */
function print_r(x, max, sep, l) {
    l = l || 0;
    max = max || 10;
    sep = sep || ' ';

    if (l > max) {
        return "[WARNING: Too much recursion]\n";
    }

    var
    i,
    r = '',
    t = typeof x,
    tab = '';

    if (x === null) {
        r += "(null)\n";
    } else if (t == 'object') {
        l++;
        for (i = 0; i < l; i++) {
            tab += sep;
        }

        if (x && x.length) {
            t = 'array';
        }

        r += '(' + t + ") :\n";

        for (i in x) {
            try {
                r += tab + '[' + i + '] : ' + print_r(x[i], max, sep, (l + 1));
            } catch(e) {
                return "[ERROR: " + e + "]\n";
            }
        }
    } else {
        if (t == 'string') {
            if (x == '') {
                x = '(empty)';
            }
        }
        r += '(' + t + ') ' + x + "\n";
    }
    return r;
};
var_dump = print_r;
// */

/*
 * Facebox (for jQuery)
 * version: 1.2 (05/05/2008)
 * @requires jQuery v1.2 or later
 *
 * Examples at http://famspam.com/facebox/
 *
 * Licensed under the MIT:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2007, 2008 Chris Wanstrath [ chris@ozmm.org ]
 *
 * Usage:
 *
 *  jQuery(document).ready(function() {
 *    jQuery('a[rel*=facebox]').facebox()
 *  })
 *
 *  <a href="#terms" rel="facebox">Terms</a>
 *    Loads the #terms div in the box
 *
 *  <a href="terms.html" rel="facebox">Terms</a>
 *    Loads the terms.html page in the box
 *
 *  <a href="terms.png" rel="facebox">Terms</a>
 *    Loads the terms.png image in the box
 *
 *
 *  You can also use it programmatically:
 *
 *    jQuery.facebox('some html')
 *
 *  The above will open a facebox with "some html" as the content.
 *
 *    jQuery.facebox(function($) {
 *      $.get('blah.html', function(data) { $.facebox(data) })
 *    })
 *
 *  The above will show a loading screen before the passed function is called,
 *  allowing for a better ajaxy experience.
 *
 *  The facebox function can also display an ajax page or image:
 *
 *    jQuery.facebox({ ajax: 'remote.html' })
 *    jQuery.facebox({ image: 'dude.jpg' })
 *
 *  Want to close the facebox?  Trigger the 'close.facebox' document event:
 *
 *    jQuery(document).trigger('close.facebox')
 *
 *  Facebox also has a bunch of other hooks:
 *
 *    loading.facebox
 *    beforeReveal.facebox
 *    reveal.facebox (aliased as 'afterReveal.facebox')
 *    init.facebox
 *
 *  Simply bind a function to any of these hooks:
 *
 *   $(document).bind('reveal.facebox', function() { ...stuff to do after the facebox and contents are revealed... })
 *
 */
(function($) {
  $.facebox = function(data, klass) {
    $.facebox.loading()

    if (data.ajax) fillFaceboxFromAjax(data.ajax)
    else if (data.image) fillFaceboxFromImage(data.image)
    else if (data.div) fillFaceboxFromHref(data.div)
    else if ($.isFunction(data)) data.call($)
    else $.facebox.reveal(data, klass)
  }

  /*
   * Public, $.facebox methods
   */

  $.extend($.facebox, {
    settings: {
      opacity      : .5,
      overlay      : true,
      loadingImage : '/views/images/loading.gif',
      closeImage   : '/views/images/closelabel.gif',
      imageTypes   : [ 'png', 'jpg', 'jpeg', 'gif' ],
      faceboxHtml  : '\
    <div id="facebox" style="display:none;"> \
      <div class="popup"> \
        <table> \
          <tbody> \
            <tr> \
              <td class="tl"/><td class="b"/><td class="tr"/> \
            </tr> \
            <tr> \
              <td class="b"/> \
              <td class="body"> \
                <div class="content"> \
                </div> \
                <div class="footer"> \
                  <a href="#" class="close"> \
                    <img src="/facebox/closelabel.gif" title="close" class="close_image" /> \
                  </a> \
                </div> \
              </td> \
              <td class="b"/> \
            </tr> \
            <tr> \
              <td class="bl"/><td class="b"/><td class="br"/> \
            </tr> \
          </tbody> \
        </table> \
      </div> \
    </div>'
    },

    loading: function() {
      init()
      if ($('#facebox .loading').length == 1) return true
      showOverlay()

      $('#facebox .content').empty()
      $('#facebox .body').children().hide().end().
        append('<div class="loading"><img src="'+$.facebox.settings.loadingImage+'"/></div>')

      $('#facebox').css({
        top:	getPageScroll()[1] + (getPageHeight() / 10),
        left:	385.5
      }).show()

      $(document).bind('keydown.facebox', function(e) {
        if (e.keyCode == 27) $.facebox.close()
        return true
      })
      $(document).trigger('loading.facebox')
    },

    reveal: function(data, klass) {
      $(document).trigger('beforeReveal.facebox')
      if (klass) $('#facebox .content').addClass(klass)
      $('#facebox .content').append(data)
      $('#facebox .loading').remove()
      $('#facebox .body').children().fadeIn('normal')
      $('#facebox').css('left', $(window).width() / 2 - ($('#facebox table').width() / 2))
      $(document).trigger('reveal.facebox').trigger('afterReveal.facebox')
    },

    close: function() {
      $(document).trigger('close.facebox')
      return false
    }
  })

  /*
   * Public, $.fn methods
   */

  $.fn.facebox = function(settings) {
    init(settings)

    function clickHandler() {
      $.facebox.loading(true)

      // support for rel="facebox.inline_popup" syntax, to add a class
      // also supports deprecated "facebox[.inline_popup]" syntax
      var klass = this.rel.match(/facebox\[?\.(\w+)\]?/)
      if (klass) klass = klass[1]

      fillFaceboxFromHref(this.href, klass)
      return false
    }

    return this.click(clickHandler)
  }

  /*
   * Private methods
   */

  // called one time to setup facebox on this page
  function init(settings) {
    if ($.facebox.settings.inited) return true
    else $.facebox.settings.inited = true

    $(document).trigger('init.facebox')
    makeCompatible()

    var imageTypes = $.facebox.settings.imageTypes.join('|')
    $.facebox.settings.imageTypesRegexp = new RegExp('\.' + imageTypes + '$', 'i')

    if (settings) $.extend($.facebox.settings, settings)
    $('body').append($.facebox.settings.faceboxHtml)

    var preload = [ new Image(), new Image() ]
    preload[0].src = $.facebox.settings.closeImage
    preload[1].src = $.facebox.settings.loadingImage

    $('#facebox').find('.b:first, .bl, .br, .tl, .tr').each(function() {
      preload.push(new Image())
      preload.slice(-1).src = $(this).css('background-image').replace(/url\((.+)\)/, '$1')
    })

    $('#facebox .close').click($.facebox.close)
    $('#facebox .close_image').attr('src', $.facebox.settings.closeImage)
  }

  // getPageScroll() by quirksmode.com
  function getPageScroll() {
    var xScroll, yScroll;
    if (self.pageYOffset) {
      yScroll = self.pageYOffset;
      xScroll = self.pageXOffset;
    } else if (document.documentElement && document.documentElement.scrollTop) {	 // Explorer 6 Strict
      yScroll = document.documentElement.scrollTop;
      xScroll = document.documentElement.scrollLeft;
    } else if (document.body) {// all other Explorers
      yScroll = document.body.scrollTop;
      xScroll = document.body.scrollLeft;
    }
    return new Array(xScroll,yScroll)
  }

  // Adapted from getPageSize() by quirksmode.com
  function getPageHeight() {
    var windowHeight
    if (self.innerHeight) {	// all except Explorer
      windowHeight = self.innerHeight;
    } else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
      windowHeight = document.documentElement.clientHeight;
    } else if (document.body) { // other Explorers
      windowHeight = document.body.clientHeight;
    }
    return windowHeight
  }

  // Backwards compatibility
  function makeCompatible() {
    var $s = $.facebox.settings

    $s.loadingImage = $s.loading_image || $s.loadingImage
    $s.closeImage = $s.close_image || $s.closeImage
    $s.imageTypes = $s.image_types || $s.imageTypes
    $s.faceboxHtml = $s.facebox_html || $s.faceboxHtml
  }

  // Figures out what you want to display and displays it
  // formats are:
  //     div: #id
  //   image: blah.extension
  //    ajax: anything else
  function fillFaceboxFromHref(href, klass) {
    // div
    if (href.match(/#/)) {
      var url    = window.location.href.split('#')[0]
      var target = href.replace(url,'')
      $.facebox.reveal($(target).clone().show(), klass)

    // image
    } else if (href.match($.facebox.settings.imageTypesRegexp)) {
      fillFaceboxFromImage(href, klass)
    // ajax
    } else {
      fillFaceboxFromAjax(href, klass)
    }
  }

  function fillFaceboxFromImage(href, klass) {
    var image = new Image()
    image.onload = function() {
      $.facebox.reveal('<div class="image"><img src="' + image.src + '" /></div>', klass)
    }
    image.src = href
  }

  function fillFaceboxFromAjax(href, klass) {
    $.get(href, function(data) { $.facebox.reveal(data, klass) })
  }

  function skipOverlay() {
    return $.facebox.settings.overlay == false || $.facebox.settings.opacity === null
  }

  function showOverlay() {
    if (skipOverlay()) return

    if ($('facebox_overlay').length == 0)
      $("body").append('<div id="facebox_overlay" class="facebox_hide"></div>')

    $('#facebox_overlay').hide().addClass("facebox_overlayBG")
      .css('opacity', $.facebox.settings.opacity)
      .click(function() { $(document).trigger('close.facebox') })
      .fadeIn(200)
    return false
  }

  function hideOverlay() {
    if (skipOverlay()) return

    $('#facebox_overlay').fadeOut(200, function(){
      $("#facebox_overlay").removeClass("facebox_overlayBG")
      $("#facebox_overlay").addClass("facebox_hide")
      $("#facebox_overlay").remove()
    })

    return false
  }

  /*
   * Bindings
   */

  $(document).bind('close.facebox', function() {
    $(document).unbind('keydown.facebox')
    $('#facebox').fadeOut(function() {
      $('#facebox .content').removeClass().addClass('content')
      hideOverlay()
      $('#facebox .loading').remove()
    })
  })

})(jQuery);

jQuery(document).ready(function($) {
  $('a[rel*=facebox]').facebox()
})

/**
 * labs_json Script by Giraldo Rosales.
 * Version 1.0
 * Visit www.liquidgear.net for documentation and updates.
 *
 * HOW TO USE
 * ==========
 * Serialize:
 * var obj = {};
 * obj.name	= "Test JSON";
 * obj.type	= "test";
 * $.json.serialize(obj); //output: {"name":"Test JSON", "type":"test"}
 *
 * Deserialize:
 * $.json.deserialize({"name":"Test JSON", "type":"test"}); //output: object
 *
 */
jQuery.json={serialize:function(value,replacer,space){var i;gap='';var indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' '}}else if(typeof space==='string'){indent=space}rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.serialize');}return this.str('',{'':value})},deserialize:function(text,reviver){var j;var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return reviver.call(holder,key,value)}cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j}throw new SyntaxError('JSON.parse');},f:function(n){return n<10?'0'+n:n},DateToJSON:function(key){return this.getUTCFullYear()+'-'+this.f(this.getUTCMonth()+1)+'-'+this.f(this.getUTCDate())+'T'+this.f(this.getUTCHours())+':'+this.f(this.getUTCMinutes())+':'+this.f(this.getUTCSeconds())+'Z'},StringToJSON:function(key){return this.valueOf()},quote:function(string){var meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'};var escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'},str:function(key,holder){var indent='',gap='',i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'){switch((typeof value)){case'date':this.DateToJSON(key);break;default:this.StringToJSON(key);break}}if(typeof rep==='function'){value=rep.call(holder,key,value)}switch(typeof value){case'string':return this.quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null'}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=this.str(i,value)||'null'}v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v}if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==='string'){v=this.str(k,value);if(v){partial.push(this.quote(k)+(gap?': ':':')+v)}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=this.str(k,value);if(v){partial.push(this.quote(k)+(gap?': ':':')+v)}}}}v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v}}};

/*
 * One Click Upload - jQuery Plugin
 * Copyright (c) 2008 Michael Mitchell - http://www.michaelmitchell.co.nz
 */
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('(1($){$.13.14=1(a){a=$.B({3:\'H\',5:\'15/C-16\',6:\'\',v:I,o:1(){},p:1(){},q:1(){},7:{}},a);r D $.E(z,a)},$.E=1(f,g){2 h=z;2 i=D 17().18().19().1a(8);2 j=$(\'<w \'+\'1b="w\'+i+\'" \'+\'3="w\'+i+\'"\'+\'></w>\').s({J:\'1c\'});2 k=$(\'<C \'+\'1d="1e" \'+\'5="\'+g.5+\'" \'+\'6="\'+g.6+\'" \'+\'1f="w\'+i+\'"\'+\'></C>\').s({K:0,L:0});2 l=$(\'<M \'+\'3="\'+g.3+\'" \'+\'N="H" \'+\'/>\').s({O:\'P\',J:\'1g\',1h:-1i+\'t\',1j:0});f.1k(\'<Q></Q>\');k.R(l);f.S(k);f.S(j);2 m=f.1l().s({O:\'P\',T:f.1m()+\'t\',1n:f.1o()+\'t\',1p:\'U\',1q:\'1r\',K:0,L:0});l.s(\'1s\',-m.T()-10+\'t\');m.1t(1(e){l.s({V:e.1u-m.W().V+\'t\',X:e.1v-m.W().X+\'t\'})});l.1w(1(){h.q();u(h.v){h.F()}});$.B(z,{v:I,o:g.o,p:g.p,q:g.q,1x:1(){r l.9(\'G\')},7:1(a){2 a=a?a:x;u(a){g.7=$.B(g.7,a)}y{r g.7}},3:1(a){2 a=a?a:x;u(a){l.9(\'3\',G)}y{r l.9(\'3\')}},6:1(a){2 a=a?a:x;u(a){k.9(\'6\',a)}y{r k.9(\'6\')}},5:1(a){2 a=a?a:x;u(a){k.9(\'5\',a)}y{r k.9(\'5\')}},Y:1(c,d){2 d=d?d:x;1 A(a,b){1y(a){1z:1A D 1B(\'[Z.E.Y] \\\'\'+a+\'\\\' 1C 1D 1E A.\');4;n\'3\':h.3(b);4;n\'6\':h.6(b);4;n\'5\':h.5(b);4;n\'7\':h.7(b);4;n\'v\':h.v=b;4;n\'o\':h.o=b;4;n\'p\':h.p=b;4;n\'q\':h.q=b;4}}u(d){A(c,d)}y{$.11(c,1(a,b){A(a,b)})}},F:1(){z.o();$.11(g.7,1(a,b){k.R($(\'<M \'+\'N="U" \'+\'3="\'+a+\'" \'+\'G="\'+b+\'" \'+\'/>\'))});k.F();j.1F().1G(1(){2 a=12.1H(j.9(\'3\'));2 b=$(a.1I.12.1J).1K();h.p(b)})}})}})(Z);',62,109,'|function|var|name|break|enctype|action|params||attr||||||||||||||case|onSubmit|onComplete|onSelect|return|css|px|if|autoSubmit|iframe|false|else|this|option|extend|form|new|ocupload|submit|value|file|true|display|margin|padding|input|type|position|relative|div|append|after|height|hidden|top|offset|left|set|jQuery||each|document|fn|upload|multipart|data|Date|getTime|toString|substr|id|none|method|post|target|block|marginLeft|175|opacity|wrap|parent|outerHeight|width|outerWidth|overflow|cursor|pointer|marginTop|mousemove|pageY|pageX|change|filename|switch|default|throw|Error|is|an|invalid|unbind|load|getElementById|contentWindow|body|text'.split('|'),0,{}))