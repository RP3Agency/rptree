/**
 * RPTree 2015: Express Server
 */

// Get link to main module
var app = require.main.exports;

// Create Express server
var fs			= require('fs'),
	util		= require('util'),
	http 		= require('http'),
	https 		= require('https'),
	express		= require('express')(),
	bodyParser	= require('body-parser'),
	static		= require('serve-static');

// Set up middleware
express.use( static('dist') );
express.use( bodyParser.json() );
express.use( bodyParser.urlencoded({ extended: false }) );

// Initialize feed on server start
app.on('application:start', function() {
	var server;

	if(app.config.express.ssl) {
		var opts = {
			key: fs.readFileSync( app.config.express.ssl.key ),
			cert: fs.readFileSync( app.config.express.ssl.cert ),
			ca: fs.readFileSync( app.config.express.ssl.ca ),
		};
		server = https.createServer(opts, express );

		// set up HTTP redirect to HTTPS
		http.createServer(function (req, res) {
			var hostname = req.headers['host'].replace( /^([^:]*):?\d*$/, '$1' );
    		res.writeHead(302, { "Location": util.format( app.config.express.ssl.http.redirect, hostname ) + req.url });
    		res.end();
		}).listen( app.config.express.ssl.http.port );
	} else {
		server = http.createServer( express );
	}
	server.listen( app.config.express.port, app.config.express.address, function() {
		console.log("Express server listening on address %s at port %d", app.config.express.address, app.config.express.port);
		app.emit( 'server:ready', server );
		app.emit( 'express:ready', express );
	});
	console.log('Express server initialized');
});

// Export Express server
module.exports = express;
