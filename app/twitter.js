/**
* RPTree 2014 Server: Twitter stream scanner
*/

// Get link to main module
app = require.main.exports;

// Load helper modules
var _ = require('lodash'),
	Promise = require('bluebird');

// Create Twitter scanner singleton
var Scanner = _.bindAll({

	initialize: function() {
		if(app.config.twitter) {
			console.log('<FEED> Twitter scanner initializing');
			this.connect();
		} else {
			app.config.debug && console.log('-- Twitter scanner not configured, skipping --');
		}
		return this;
	},

	connect: function() {
		var	twitter = require('twitter');
		this.client = new twitter(app.config.twitter.account);

		// Load cache on start and once an hour after
		this.search();
		this.searchTimer = setInterval(this.search, 3600000);

		// Start streaming listener
		this.scan();
	},

	// Load cache with past tweets tagged with terms
	search: function() {
		app.config.debug && console.log('<FEED> Updating cache of recent statuses');
		var self = this;
		this.client.search(app.config.twitter.terms.join(' OR '), { result_type: 'recent', count: 100 },  function(data) {
			_.each(data.statuses, function(tweet) {
				self.processTweet(tweet);
			});
		});
	},

	// Listen to status stream for incoming tweets tagged with terms
	scan: function() {
		app.config.debug && console.log('<FEED> Starting stream listener');
		var self = this;
		this.client.stream('statuses/filter', { track: app.config.twitter.terms }, function(stream) {
			stream.on('data', function(data) {
				app.config.debug && console.log("<FEED> Incoming tweet from %s", data.user.screen_name);
				self.processTweet(data)
				.then(function(tweet) {
					app.tree.send('TWEET');
				});
			});
			stream.on('end', function() {
				console.log("<FEED> !!! Warning! Twitter stream has closed!");

				// Destroy the stream
				stream.destroy();

				// Restart scanner after 30 seconds
				setTimeout(this.scan, 30000);
			});
			stream.on('error', function(err) {
				console.log("<FEED> !!! ERROR (Twitter): ", err);
			});
		});

	},

	// Analyzing and processing a single tweet
	processTweet: function(tweet) {
		var webpurify = require('webpurify'),
		purify = Promise.promisifyAll(new webpurify(app.config.webpurify)),
		text = require('twitter-text'),
		emoji = require('emoji');

		return purify.checkAsync([tweet.user.screen_name, tweet.user.name, tweet.text].join(' '))
		.then(function(isProfane) {
			var incoming = {
				id: tweet.id_str,
				user: tweet.user.screen_name,
				name: emoji.unifiedToHTML(tweet.user.name),
				profileImage: tweet.user.profile_image_url,
				text: emoji.unifiedToHTML(text.autoLink(tweet.text, { urlEntities: tweet.entities.urls })),
				tags: _.pluck(tweet.entities.hashtags, 'text'),
				timestamp: tweet.timestamp_ms ? new Date(parseInt(tweet.timestamp_ms)) : new Date(tweet.created_at),
			};

			if(isProfane) {
				app.config.debug && console.log('<FEED> *** BAD LANGUAGE DETECTED ***');
				return Promise.resolve(false);
			} else {
				app.config.debug && console.log("<FEED> Saving tweet %s from %s", incoming.id, incoming.user);
				// save tweet to Mongo
				return app.data.saveTweet(incoming)
				.return(incoming)
				.catch(function(err) {
					app.config.debug && console.log("<FEED> !!! ERROR: ", err);
				});
			}
		})
		.catch(function(err) {
			console.log("<FEED> !!! ERROR (WebPurify): ", err);
		});

	},

});

// Export scanner module
module.exports = Scanner.initialize();
