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

	var twitter = require('twitter'),
		text = require('twitter-text'),
		client = new twitter(app.config.twitter.account),
		Promise = require('bluebird'),
		emoji = require('emoji'),
		webpurify = require('webpurify'),
		purify = Promise.promisifyAll(new webpurify(app.config.webpurify));

	client.stream('statuses/filter', { track: app.config.twitter.terms }, function(stream) {
		stream.on('data', function (data) {
			// analyze tweet with WebPurify
			purify.checkAsync([data.user.screen_name, data.user.name, data.text].join(' '))
			.then(function(isProfane) {
				var incoming = {
					id: data.id_str,
					user: data.user.screen_name,
					name: emoji.unifiedToHTML(data.user.name),
					profileImage: data.user.profile_image_url,
					text: emoji.unifiedToHTML(text.autoLink(data.text, { urlEntities: data.entities.urls })),
					timestamp: new Date(parseInt(data.timestamp_ms)),
				};

				app.config.debug && console.log("<FEED> Incoming tweet from %s", incoming.user);
				if(isProfane) {
					app.config.debug && console.log('<FEED> *** BAD LANGUAGE DETECTED ***');
				} else {
					// save tweet to Mongo
					app.data.saveTweet(incoming)
					.then(function() {
						//TODO: trigger tree effect
					})
					.catch(function(err) {
						app.config.debug && console.log("<FEED> !!! ERROR: ", err);
					});
				}
			});
		});
	});
} else {
	app.config.debug && console.log('-- Twitter scanner not configured, skipping --');
}

// Export data module
module.exports = scanner;
