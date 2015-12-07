/**
* RPTree 2015: Twitter Stream Scanner
*/

// Get link to main module
var app = require.main.exports;

// Load helper modules
var _			= require('lodash'),
	Promise		= require('bluebird')
	twitter		= require('twitter'),
	webpurify	= require('webpurify'),
	text		= require('twitter-text'),
	emoji		= require('emoji');
;

// Create Twitter Scanner singleton
var scanner = _.bindAll({

	init: function() {
		if( app.config.twitter ) {
			console.log('Twitter: Scanner initializing');

			this.connect();
		} else {
			app.config.debug && console.log('-- Twitter: scanner not configured, skipping...');
		}
	},

	connect: function() {
		this.client = new twitter( app.config.twitter.account );

		// Load cache on start and once an hour after
		this.search();
		this.searchTimer = setInterval( this.search, 3600000 );

		// Start streaming listener
		this.scan();
	},

	// Load cache with past tweets tagged with terms
	search: function() {
		app.config.debug && console.log('Twitter: Updating cache of recent statuses');

		var self = this;
		this.client.get('search/tweets', { q: app.config.twitter.terms.join(' OR '), result_type: 'recent', count: 100 }, function(err, data) {
			if( err ) {
				console.log("## Twitter error: ", err);
				return;
			}
			_.each(data.statuses, function(tweet) {
				self.processTweet( tweet );
			});
		});
	},

	// Listen to status stream for incoming tweets tagged with terms
	scan: function() {
		app.config.debug && console.log('Twitter: Starting stream listener');
		var self = this;
		this.client.stream('statuses/filter', { track: app.config.twitter.terms.join(',') }, function(stream) {
			stream.on('data', function(data) {
				app.config.debug && console.log("Twitter: Incoming tweet from %s", data.user.screen_name);
				self.processTweet(data);
			});
			stream.on('end', function() {
				console.log("## Twitter: Stream has closed!");

				// Destroy the stream
				stream.destroy();

				// Restart scanner after 30 seconds
				setTimeout(self.scan, 30000);
			});
			stream.on('error', function(err) {
				console.log("## Twitter error: ", err);
			});
		});

	},

	// Analyzing and processing a single tweet
	processTweet: function(tweet) {
		var purify = new webpurify( app.config.webpurify );
		purify.check( [ tweet.user.screen_name, tweet.user.name, tweet.text ].join(' ') )
		.then(function(isProfane) {
			var incoming = {
				id:				tweet.id_str,
				user:			tweet.user.screen_name,
				name:			emoji.unifiedToHTML( tweet.user.name ),
				profileImage:	tweet.user.profile_image_url,
				text:			emoji.unifiedToHTML( text.autoLink(tweet.text, { urlEntities: tweet.entities.urls }) ),
				tags:			_.pluck( tweet.entities.hashtags, 'text' ),
				timestamp:		( tweet.timestamp_ms ) ? new Date( parseInt(tweet.timestamp_ms) ) : new Date( tweet.created_at ),
			};

			if(isProfane) {
				app.config.debug && console.log('Twitter: WebPurify rejected tweet');
				return Promise.resolve(false);
			} else {
				app.config.debug && console.log("Twitter: Saving tweet %s from %s", incoming.id, incoming.user);
				// save tweet to Mongo
				return app.data.saveTweet(incoming)
				.return(incoming)
				.catch(function(err) {
					app.config.debug && console.log("## Twitter error: ", err);
				});
			}
		})
		.catch(function(err) {
			console.log("## WebPurify error: ", err);
		});

	},

});

app.on( 'application:start', scanner.init );

// Set module export
module.exports = scanner;
