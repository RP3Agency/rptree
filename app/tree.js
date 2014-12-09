/**
* RPTree 2014 Server: Tree controller
*/

// Get link to main module
app = require.main.exports;

app.config.debug && console.log('<TREE> Loading tree controller');

// Load required modules
var osc = require('node-osc'),
	client = new osc.Client(app.config.tree.address, app.config.tree.port);

var tree = {
	send: function(command) {
		app.config.debug && console.log("<TREE> Sending command %s", command);

		client.send(command);
	}
}

// Export tree controller
module.exports = tree;
