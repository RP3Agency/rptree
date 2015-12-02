/**
 * RPTree 2015: Application Server
 */

// Create application
var EventEmitter = require('events').EventEmitter,
	app = module.exports = new EventEmitter();

// Load utilities
var _ = require('lodash'),
	requireAll = _.partial( require('require-directory'), module );

// Define application globals
app.name = 'rptree';

// Load configuration
app.config = require('config');

// Load application modules
_.assign( app, requireAll() );

// Start application
app.emit('application:start');
