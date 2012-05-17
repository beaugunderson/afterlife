var express = require('express');
var querystring = require('querystring');
var request = require('request');
var sprintf = require('sprintf').sprintf;
var OAuth2 = require('oauth').OAuth2;

var apiBaseUrl = 'https://api.singly.com';
var hostBaseUrl = 'http://afterlife-game.com';

// The port that this express app will listen on
var port = 8046;

var config = JSON.parse(fs.readFileSync('config.json'));

var usedServices = [
   'Facebook',
   'foursquare',
   'Instagram',
   'Tumblr',
   'Twitter',
   'LinkedIn'
];

var oa = new OAuth2(config.clientId, config.clientSecret, apiBaseUrl);

// A convenience method that takes care of adding the access token to requests
function getProtectedResource(path, session, callback) {
   oa.getProtectedResource(baseUrl + path, session.access_token, callback);
}

// Given the name of a service and the array of profiles, return a link to that
// service that's styled appropriately (i.e. show a link or a checkmark).
function getLink(prettyName, profiles) {
   var service = prettyName.toLowerCase();

   // If the user has a profile authorized for this service
   if (profiles && profiles[service] !== undefined) {
      // Return a unicode checkmark so that the user doesn't try to authorize it again
      return sprintf('<span class="check">&#10003;</span> %s', prettyName);
   }

   // This flow is documented here: http://dev.singly.com/authorization
   var queryString = querystring.stringify({
      client_id: config.clientId,
      redirect_uri: sprintf('%s/callback', hostBaseUrl),
      service: service
   });

   return sprintf('<a href="%s/oauth/authorize?%s">%s</a>',
      apiBaseUrl,
      queryString,
      prettyName);
}

// Create an HTTP server
var app = express.createServer();

// Setup for the express web framework
app.configure(function() {
   app.use(express.logger());
   app.use(express.static(__dirname + '/public'));
   app.use(express.bodyParser());
   app.use(express.cookieParser());
   app.use(express.session({
      secret: 'interwebs',
   }));
   app.use(app.router);
});

// We want exceptions and stracktraces in development
app.configure('development', function() {
   app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
   }));
});

// ... but not in production
app.configure('production', function() {
   app.use(express.errorHandler());
});

// Use ejs instead of jade because HTML is easy
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
   var i;
   var services = [];

   // For each service in usedServices, get a link to authorize it
   for (i = 0; i < usedServices.length; i++) {
      services.push({
         name: usedServices[i],
         link: getLink(usedServices[i], req.session.profiles)
      });
   }

   // Render out views/index.ejs, passing in the array of links and the session
   res.render('index', {
      services: services,
      session: req.session
   });
});

app.get('/callback', function(req, res) {
   var data = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: req.param('code')
   };

   request.post({
      uri: sprintf('%s/oauth/access_token', apiBaseUrl),
      body: querystring.stringify(data),
      headers: {
         'Content-Type': 'application/x-www-form-urlencoded'
      }
   }, function (err, resp, body) {
      try {
         body = JSON.parse(body);
      } catch(parseErr) {
         return res.send(parseErr, 500);
      }

      req.session.access_token = body.access_token;

      singly.getProtectedResource('/profiles', req.session, function(err, profilesBody) {
         try {
            profilesBody = JSON.parse(profilesBody);
         } catch(parseErr) {
            return res.send(parseErr, 500);
         }

         req.session.profiles = profilesBody;

         res.redirect('/');
      });
   });
});

app.listen(port);
