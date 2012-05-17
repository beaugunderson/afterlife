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

// Runs after the page has loaded
$(function() {
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
