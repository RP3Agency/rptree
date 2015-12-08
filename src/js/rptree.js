/* global rptree:true */

// Define our "rptree" object, if not already defined
if ( rptree === undefined ) { var rptree = {}; }

var rptree = (function($) {

	'use strict';

	var

	scrollToInstructions = function() {

		$('#instructions-arrow').on( 'click', function() {

			$('html, body').animate({
				scrollTop: $('#cardboard').offset().top
			}, 1000);
		});
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
