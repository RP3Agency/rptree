/**
* RPTree 2014 Server
*/

// Import configuration
var config = require('config');

// Load promises (bluebird)
var Promise = require('bluebird');

// Set up tree connection
var osc = require('node-osc'),
	tree = new osc.Client(config.tree.address, config.tree.port);

// Set up Twitter listener
if(config.twitter) {
	var twitter = require('ntwitter'),
		text = require('twitter-text'),
		client = new twitter(config.twitter.account),
		webpurify = require('webpurify'),
		purify = Promise.promisifyAll(new webpurify(config.webpurify));

	client.stream('statuses/filter', { track: config.twitter.terms }, function(stream) {
  		stream.on('data', function (data) {
			// analyze tweet with WebPurify
			purify.checkAsync([data.user.screen_name, data.user.name, data.text].join(' '))
			.then(function(isProfane) {
				var incoming = {
					user: data.user.screen_name,
					text: text.autoLink(data.text),
					name: data.user.name,
					profileImage: data.user.profile_image_url,
					timestamp: new Date().getTime()
				};

				console.log("TWEET: ", incoming);
				if(isProfane) {
					console.log('*** BAD LANGUAGE DETECTED ***');
				} else {
					//TODO: save tweet to Mongo
					tree.send('/tweet', incoming.user);
				}
			});
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
server.get(/.*/, restify.serveStatic({
	directory: './www',
	default: 'index.html'
}));

// Start Restify server
server.listen(config.server.port, function() {
	console.log('(SRV) %s listening at %s', server.name, server.url);
});
