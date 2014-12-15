/**
* RPTree 2014 Server: Tree controller
*/

// Get link to main module
app = require.main.exports;

// Load required modules
var _ = require('lodash');

// Create Twitter scanner singleton
var Tree = _.bindAll({
	clients: [],

	initialize: function() {
		app.config.debug && console.log('<TREE> Loading tree server');

		var self = this,
			net = require('net');

		// Create TCP Server
		var server = this.server = net.createServer(function(client) {
			client.nickname = client.remoteAddress + "@" + client.remotePort;
			self.clients.push(client);

			// Log it to the server output
			app.config.debug && console.log('<TREE> New tree client connected: ' + client.nickname);

			// Send acknowledgement of connection
			client.write('OK');

			// Log client responses but do nothing at this time
			client.on('data', function(data) {
				console.log("<TREE> Client message from %s: %s", client.nickname, data);
			});

			// Remove client on termination
			client.on('end', function() {
				app.config.debug && console.log('<TREE> Client disconnected: ' + client.nickname);
				self.clients = _(self.clients).without(client);
			});

			// Log client errors
			client.on('error', function(err) {
				console.log('<TREE> !!! Client error: ', err.message);
			});
		});

		// Log server errors
		server.on('error', function(err) {
			console.log('<TREE> !!! Server error: ', err.message);
		});

		server.listen(app.config.snowball.port, function() {
			var address = server.address();
			console.log('<TREE> %s listening at %s', address.address, address.port);
		});

		return this;
	},

	send: function(command) {
		app.config.debug && console.log("<TREE> Sending command %s", command);

		_(this.clients).each(function(client) {
			client.write(command);
		});
	}

});

// Export tree controller
module.exports = Tree.initialize();
