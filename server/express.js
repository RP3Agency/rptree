/**
 * NS Sustainability: Express Server
 */

// Get link to main module
var app = require.main.exports;

// Load required modules
// var _ = require('lodash');

// Create Express server
var http 		= require('http'),
	express		= require('express')(),
	bodyParser	= require('body-parser'),
	static		= require('serve-static');

// Set up middleware
express.use( static('dist') );
express.use( bodyParser.json() );
express.use( bodyParser.urlencoded({ extended: false }) );

/*  TODO: make into routes module?

// Define REST route to retrieve tweets from Mongo (used by Backbone)
express.get('/feed', function(req, res) {
	app.config.debug && console.log("<SRV> Feed request, params = " + JSON.stringify(req.params));
	app.data.listTweets(req.params)
	.then(function(tweets) {
		res.json(tweets);
	})
	.catch(function(err) {
		app.config.debug && console.log("<SRV> !!! ERROR: ", err);
		res.status(500);
	});
});

*/

// Initialize feed on server start
app.on('application:start', function() {

	var httpServer = http.createServer(express);
	httpServer.listen(app.config.express.port, app.config.express.address, function() {

		console.log("Express server listening on address %s at port %d", app.config.express.address, app.config.express.port);
		app.emit( 'http:ready', httpServer );
		app.emit( 'express:ready', express );

	});

	console.log('Express server initialized');
});

// Export Express server
module.exports = express;
