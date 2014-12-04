/**
* RPTree 2014 Server
*/

// Import configuration
var config = require('config');

// Set up tree connection
var osc = require('node-osc'),
	tree = new osc.Client(config.tree.address, config.tree.port);

// Set up Twitter listener
if(config.twitter) {
	var twitter = require('ntwitter'),
		text = require('twitter-text'),
		client = new twitter(config.twitter.account);

	client.stream('statuses/filter', { track: config.twitter.terms }, function(stream) {
  		stream.on('data', function (data) {
  			var twitterText = text.autoLink(data.text);
  			var incoming = {
  	      		user: data.user.screen_name,
  	      		text: twitterText,
  	      		name: data.user.name,
  	      		profileImage: data.user.profile_image_url,
  	      		timestamp: new Date().getTime()
  			};

			//TODO: analyze tweet with WebPurify
			//TODO: save tweet to Mongo
			config.debug && console.log("TWEET: ", incoming);

			tree.send('/tweet', incoming.user);
		});
	});
}

// Initialize Restify server
var restify = require('restify'),
	server = restify.createServer(config.server.options);

// Load Restify middleware
server.use(restify.queryParser());

//TODO: add REST route to retrieve tweets from Mongo (used by Backbone)

// Create static route
server.get('/', restify.serveStatic({
	directory: './www',
	default: 'index.html'
}));

// Start Restify server
server.listen(config.server.port, function() {
	console.log('(SRV) %s listening at %s', server.name, server.url);
});
