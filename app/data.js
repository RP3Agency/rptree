/**
* RPTree 2014 Server: Data module
*/

// Get link to main module
app = require.main.exports;

app.config.debug && console.log('<DB> Loading data module');

// Load required modules
var _ = require('lodash'),
	Promise = require('bluebird'),
	db = require('monk')(app.config.db);

// Ensure indexes
var tweets = db.get('tweets');
tweets.index({ 'id': -1 }, { unique: true });
tweets.index({ 'timestamp': -1 });

// Create database singleton
var data = {
	listTweets: function(params) {
		var opts = {
			skip: _.parseInt(params.skip) || 0,
			limit: _.parseInt(params.limit) || app.config.feed.pagesize,
			sort: { id: -1 }
		};
		var query = {};
		if(params.before && Date.parse(params.before)) {
			_.assign(query, { timestamp: { $lt: new Date(params.before) } });
		}
		if(params.after && Date.parse(params.after)) {
			_.assign(query, { timestamp: { $gt: new Date(params.after) } });
		}
		if(params.since && !_.isNaN(parseInt(params.since))) {
			_.assign(query, { id: { $gt: params.since } });
		}
		if(params.priorTo && !_.isNaN(parseInt(params.priorTo))) {
			_.assign(query, { id: { $lt: params.priorTo } });
		}

		var result = tweets.find(query, opts)
		.error(function(err) {
			console.log('<DB> !!! ERRROR: ', err);
		});
		return Promise.cast(result);
	},
	saveTweet: function(tweet) {
		var result = tweets.findAndModify(
			{ id: tweet.id },
			{ $set: tweet },
			{ upsert: true, new: true }
		)
		.error(function(err) {
			console.log('<DB> !!! ERRROR: ', err);
		});
		return Promise.cast(result);
	},
};

// Export data module
module.exports = data;
