// The URL of the Singly API endpoint
var apiBaseUrl = 'https://api.singly.com';

// A small wrapper for getting data from the Singly API
var singly = {
   get: function(url, options, callback) {
      if (options === undefined ||
         options === null) {
         options = {};
      }

      options.access_token = accessToken;

      $.getJSON(apiBaseUrl + url, options, callback);
   }
};

function setupFire() {
  canvas = $("#fire");
  particles = new ParticleCanvas(canvas[0], {y:canvas.height() - 50});
  particles.update({
        shape: 'square',
        velocity: new Vector({y: -2}),
        xVariance: 130,
        yVariance: 5,
        spawnSpeed: 200,
        generations: 100000,
        maxParticles: 1000,
        size: 20,
        sizeVariance: 10,
        life: 30,
        lifeVariance: 10,    
        direction: 0,
        directionVariance: 15,
        color: '#fff',
        opacity: 1,
        onDraw: function(p) {
          var y = -this.age * 3;
          p.size *= 0.98;
          p.color = 'rgb(255, ' + (y + 180) + ', 68)';
          p.opacity = 0.5 - (p.age / p.life * 0.4);
        }
      });
  particles.start();
  $("#fire").css("left", $(window).width() / 2 - 300);
  var canvasPos = $("#fire").position().left;
  $("#skullRight").css("left", canvasPos + $("#fire").width() + "px");
  $("#skullLeft").css("left", canvasPos - 100 + "px");
}

 
// Runs after the page has loaded
$(function() {
  setupFire();

   var momentum = new dragMomentum(240, 3, 'linear');

   $('#boxes > div').draggable({
      scroll: false,
      containment: 'window',
      // start and stop. We add in the momentum functions here.
      start: function(e, ui) {
         momentum.start($(this), e.clientX, e.clientY, e.timeStamp);
      },
      stop: function(e, ui) {
         momentum.end($(this), e.clientX, e.clientY, e.timeStamp);
      }
   });

   $('#boxes > div').each(function() {
      var $e = $(this);

      setTimeout(function() {
         $e.addClass('pulsing');
         $e.addClass('gyrating');
      }, Math.random() * 2000);
   });

   // If there was no access token defined then return
   if (accessToken === 'undefined' ||
      accessToken === undefined) {
      return;
   }

   // Get the user's profiles
   singly.get('/profiles', null, function(profiles) {
      _.each(profiles, function(profile) {
         console.log('profile', profile);
      });
   });

   // Get the 5 latest items from the user's Facebook feed
   singly.get('/services/facebook/feed', { limit: 5 }, function(feed) {
      console.log('feed', feed);
   });
});

function dragMomentum(howMuch, minDrift, easeType) {
   this.howMuch = howMuch; // change this for greater or lesser momentum
   this.minDrift = minDrift; // minimum drift after a drag move
   this.easeType = easeType;

   //  The standard ease types are 'linear' and 'swing'
   //  To use special ease types, you need this plugin:
   //  jquery.easing.1.3.js  http://gsgd.co.uk/sandbox/jquery/easing/
   //  special ease types:  'linear',  'swing',  'easeInQuad',
   //  'easeOutQuad',  'easeInOutQuad',  'easeInCubic',
   //  'easeOutCubic',  'easeInOutCubic',  'easeInQuart',
   //  'easeOutQuart',  'easeInOutQuart', 'easeInQuint',
   //  'easeOutQuint',  'easeInOutQuint',  'easeInSine',
   //  'easeOutSine',  'easeInOutSine',  'easeInExpo',
   //  'easeOutExpo',  'easeInOutExpo',  'easeInCirc',
   //  'easeOutCirc',  'easeInOutCirc',  'easeInElastic',
   //  'easeOutElastic',  'easeInOutElastic',  'easeInBack',
   //  'easeOutBack',  'easeInOutBack',  'easeInBounce',
   //  'easeOutBounce',  'easeInOutBounce'
   //
   //  Also see this page for a great display of the easing types.
   //  http://jqueryui.com/demos/effect/#easing
}

dragMomentum.prototype.start = function(e, Xa, Ya, Ta) {
   console.log('sta: Xa, Ya, Ta', Xa, Ya, Ta);

   e.data('dXa', Xa);
   e.data('dYa', Ya);
   e.data('dTa', Ta);
};

dragMomentum.prototype.end = function(e, Xb, Yb, Tb) {
   var Xa = e.data('dXa');
   var Ya = e.data('dYa');
   var Ta = e.data('dTa');

   console.log('end: Xa, Ya, Ta', Xa, Ya, Ta);
   console.log('end: Xb, Yb, Tb', Xb, Yb, Tb);

   var Xc = 0;
   var Yc = 0;

   var dDist = Math.sqrt(Math.pow(Xa - Xb, 2) + Math.pow(Ya - Yb, 2));
   var dTime = Tb - Ta;
   var dSpeed = dDist / dTime;

   dSpeed = Math.round(dSpeed * 100) / 100;

   var distX =  Math.abs(Xa - Xb);
   var distY =  Math.abs(Ya - Yb);

   var dVelocityX = (this.minDrift + (Math.round(distX * dSpeed * this.howMuch / (distX + distY))));
   var dVelocityY = (this.minDrift + (Math.round(distY * dSpeed * this.howMuch / (distX + distY))));

   var position = e.position();

   var locX = position.left;
   var locY = position.top;

   console.log('locX, locY', locX, locY);

   if (Xa > Xb) {  // we are moving left
      Xc = locX - dVelocityX;
   } else {  //  we are moving right
      Xc = locX + dVelocityX;
   }

   if (Ya > Yb) {  // we are moving up
      Yc = (locY - dVelocityY);
   } else {  // we are moving down
      Yc = (locY + dVelocityY);
   }

   console.log('Xc', Xc, 'Yc', Yc);

   var newLocX = Xc + 'px';
   var newLocY = Yc + 'px';

   e.animate({ left: newLocX, top: newLocY }, 700, this.easeType);
};
