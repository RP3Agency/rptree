/* global rptree:true */

// Define our "rptree" object, if not already defined
if ( rptree === undefined ) { var rptree = {}; }

var rptree = (function($) {

	'use strict';

	var

	scrollToInstructions = function() {

	},

	init = function() {
		scrollToInstructions();
	};

	return {
		init:init,
	};

}(jQuery));

(function() {
	'use strict';
	rptree.init();
}());
