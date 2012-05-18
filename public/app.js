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

var sources = [
   {
      service: 'facebook',
      type: 'home'
   },
   {
      service: 'instagram',
      type: 'feed'
   },
   {
      service: 'twitter',
      type: 'timeline'
   }
];

function getDataFn(source) {
   return function(callback) {
      singly.get('/services/' + source.service, null, function(metadata) {
         var options = { limit: 50 };

         singly.get('/services/' + source.service + '/' + source.type, options, function(data) {
            callback(null, data);
         });
      });
   };
}

function setupFire() {
  var canvas = $("#fire");

  var particles = new ParticleCanvas(canvas[0], { y: canvas.height() - 50 });

  particles.update({
     shape: 'square',
     velocity: new Vector({ y: -2 }),
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

var statuses = [];
var momentum = new dragMomentum(240, 0, 'linear');

// Runs after the page has loaded
$(function() {
   $('body').prepend('<div id="screen"></div>');

   $('#screen').show();

   setupFire();

   // If there was no access token defined then return
   if (accessToken === 'undefined' ||
      accessToken === undefined) {
      return;
   }

   // Get the user's profiles
   singly.get('/profiles', null, function(profiles) {
      //mixpanel.name_tag(profiles.id);

      if (profiles.all.length === 0) {
         return;
      }

      var functions = {};

      _.each(sources, function(source) {
         if (profiles[source.service] !== undefined) {
            functions[source.service] = getDataFn(source);
         }
      });

      $('#done-registering').show();

      $('#done-registering, #screen').click(function() {
         $('#auth-wrapper, #screen').hide();
      });

      // XXX: When /types/statuses_feed works we'll use that instead
      async.parallel(functions, function(err, results) {
         console.log('results', results);

         if (results.facebook) {
            results.facebook.forEach(function(e, i) {
               var text = e.data.message;

               if (text === undefined) {
                  text = e.data.description;
               }

               statuses.push({
                  at: e.at,
                  text: text,
                  fromId: e.data.from.id,
                  fromName: e.data.from.name
               });
            });
         }

         if (results.instagram) {
            results.instagram.forEach(function(e, i) {
               statuses.push({
                  at: e.at,
                  image: e.data.images.low_resolution.url,
                  fromId: e.data.user.id,
                  fromName: e.data.user.full_name
               });
            });
         }

         if (results.twitter) {
            results.twitter.forEach(function(e, i) {
               statuses.push({
                  at: e.at,
                  text: e.data.text,
                  fromId: e.data.user.id,
                  fromName: e.data.user.name
               });
            });
         }

         statuses = _.sortBy(statuses, 'at');

         console.log('statuses', statuses);

         var added = 0;

         var positions = [
            $('#position-1'),
            $('#position-2'),
            $('#position-3'),
            $('#position-4')
         ];

         while (added < 4) {
            if (popStatus(positions[added])) {
               added++;
            }
         }
      });
   });
});

function popStatus($position) {
   var status = statuses.pop();

   var $element;

   if (status.text === undefined &&
      status.image === undefined) {
      return false;
   }

   var text = status.text;

   if (text === undefined) {
      text = sprintf('<img src="%(image)s" />', status);
   }

   $element = $(sprintf(
      '<div class="card">' +
         '%s' +
      '</div>', text));

   $position.children().replaceWith($element);

   $element.draggable({
      scroll: false,
      containment: 'window',
      // start and stop. We add in the momentum functions here.
      start: function(e, ui) {
         momentum.start($(this), e.clientX, e.clientY, e.timeStamp);
      },
      stop: function(e, ui) {
         momentum.end($(this), e.clientX, e.clientY, e.timeStamp, function($card, destination) {
            $('#message').text(destination).show();

            popStatus($card.parent());
         });
      }
   });

   setTimeout(function() {
      $element.addClass('pulsing');
      $element.addClass('gyrating');
   }, Math.random() * 2000);

   return true;
}

function dragMomentum(howMuch, minDrift, easeType) {
   this.howMuch = howMuch; // change this for greater or lesser momentum
   this.minDrift = minDrift; // minimum drift after a drag move
   this.easeType = easeType;
}

dragMomentum.prototype.start = function(e, Xa, Ya, Ta) {
   e.data('dXa', Xa);
   e.data('dYa', Ya);
   e.data('dTa', Ta);
};

dragMomentum.prototype.end = function(e, Xb, Yb, Tb, callback) {
   var Xa = e.data('dXa');
   var Ya = e.data('dYa');
   var Ta = e.data('dTa');

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

   var Xc = '+=';
   var Yc = '+=';

   var destination = 'hell';

   if (Xa > Xb) {  // we are moving left
      Xc = '-=';
   }

   if (Ya > Yb) {  // we are moving up
      Yc = '-=';

      destination = 'heaven';
   }

   var newLocX = Xc + dVelocityX + 'px';
   var newLocY = Yc + dVelocityY + 'px';

   e.animate({
      left: newLocX,
      top: newLocY,
      opacity: 0
   }, 200, this.easeType, function() {
      callback($(this), destination);
   });
};
