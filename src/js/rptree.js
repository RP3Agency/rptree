/* global rptree:true */

// Define our "rptree" object, if not already defined
if ( rptree === undefined ) { var rptree = {}; }

var rptree = (function($) {

	'use strict';

	var

	expandCardboardHowTo = function() {

		var $button		= $('#how-to-use-cardboard-button'),
			$container	= $('#how-to-use-cardboard');

		$button.on( 'click', function() {
			$container.slideDown( 200, function() {
				$button.off( 'click' ).attr('disabled', '').trigger('blur');
			});
		});
	},

	init = function() {
		expandCardboardHowTo();
	};

	return {
		init:init,
	};

}(jQuery));

(function() {
	'use strict';
	rptree.init();
}());
