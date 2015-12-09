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

	desktopStyling = function() {

		var hash = location.hash;

		if ( -1 < hash.indexOf( 'desktop' ) ) {
			$('body').addClass('desktop');
		}
	},

	init = function() {
		scrollToInstructions();
		desktopStyling();
	};

	return {
		init:init,
	};

}(jQuery));

(function() {
	'use strict';
	rptree.init();

	function leaderboardStats() {
		var thankYou = 'Thank you for supporting ';
		var charities = {};
			charities['cn'] = "Children's National!";
			charities['ja'] = "Junior Achievement!";
			charities['wawf'] = "The Washington Area Women's Foundation!";
		console.log(Cookies);
		if ( Cookies != undefined) {
			var cookies = Cookies.getJSON('rp3.rptree');
			$('#this-round').html(cookies.player.lastScore);
			$('#player-high').html(cookies.player.highScore);
			if(cookies.player.charity != undefined) {
				$('#thank-you').html(thankYou + charities[cookies.player.charity]);
			}
		}
	}
	leaderboardStats();
}());
