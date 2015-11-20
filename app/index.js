/**
* RPTree 2015 Server
*/

// Create application
var app = module.exports = {};

// Load utilities
var _ = require('lodash');

// Load configuration
app.config = require('config');

// Load application modules
_(app).assign( require('require-directory')(module) );
