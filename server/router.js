/**
 * RPTree 2015: Router Module
 */

// Get link to main module
var app = require.main.exports;

// Load required modules
var _			= require('lodash'),
	Promise		= require('bluebird');

var router = _.bindAll({

	init: function() {
		var self = this;

		// subscribe to Express ready event
		app.on('express:ready', function() {
			console.log('Adding routes to Express');

			app.express.get( '/feed', self.getFeed );
		});

		console.log('Router initialized');
	},

	// Define REST route to retrieve tweets
	getFeed: function(req, res) {
		app.config.debug && console.log('Router: feed request, params = ' + JSON.stringify(req.params));
		// app.data.listTweets(req.params)
		// .then(function(tweets) {
		// 	res.json(tweets);
		// })
		// .catch(function(err) {
		// 	app.config.debug && console.log('## Router error: ', err);
		// 	res.status(500);
		// });

		//TODO debug statement below
		res.json({});
	},

});

app.on( 'application:start', router.init );

// Set module export
module.exports = router;
