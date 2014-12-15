/**
* RPTree 2014 Server: Restify server
*/

// Get link to main module
app = require.main.exports;

// Initialize Restify server
var restify = require('restify'),
server = restify.createServer(app.config.server.options);

// Load Restify middleware
server.use(restify.queryParser());
server.use(restify.CORS());

// Define REST route to retrieve tweets from Mongo (used by Backbone)
server.get('/feed', function(req, res) {
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

// Create static route
server.get(/.*/, restify.serveStatic({
	directory: './www',
	default: 'index.html'
}));

// Start Restify server
server.listen(app.config.server.port, function() {
	console.log('<SRV> %s listening at %s', server.name, server.url);
});

// Export server
module.exports = server;
