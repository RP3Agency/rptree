/**
* RPTree 2014 Server: Twitter stream scanner
*/

// Get link to main module
app = require.main.exports;

// Initialize scanner
var scanner = { };

// Set up Twitter listener
if(app.config.twitter) {
	app.config.debug && console.log('<FEED> Twitter scanner starting');

	var _ = require('lodash'),
		twitter = require('twitter'),
		text = require('twitter-text'),
		client = new twitter(app.config.twitter.account),
		Promise = require('bluebird'),
		emoji = require('emoji'),
		webpurify = require('webpurify'),
		purify = Promise.promisifyAll(new webpurify(app.config.webpurify));

	// Define method for analyzing and processing a single tweet
	var processTweet = function(tweet) {
		// analyze tweet with WebPurify
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
				// save tweet to Mongo
				return app.data.saveTweet(incoming)
				.return(incoming)
				.catch(function(err) {
					app.config.debug && console.log("<FEED> !!! ERROR: ", err);
				});
			}
		});
	};

	// Load Mongo with cache of past tweets tagged with terms
	client.search(app.config.twitter.terms.join(' OR '), { result_type: 'recent', count: 100 },  function(data) {
		_.each(data.statuses, function(tweet) {
			processTweet(tweet);
		});
	});

	// Listen to status stream for incoming tweets tagged with terms
	scanner = client.stream('statuses/filter', { track: app.config.twitter.terms }, function(stream) {
		stream.on('data', function(data) {
			app.config.debug && console.log("<FEED> Incoming tweet from %s", data.user.screen_name);
			processTweet(data)
			.then(function(tweet) {
				//TODO: send tweet notification to tree
			});
		});
	});

} else {
	app.config.debug && console.log('-- Twitter scanner not configured, skipping --');
}

// Export scanner module
module.exports = scanner;
