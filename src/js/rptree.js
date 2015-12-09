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

	function leaderboardStats() {
		var thankYou = 'Thank you for supporting ';
		var charities = {};
			charities['cn'] = "Children's National!";
			charities['ja'] = "Junior Achievement!";
			charities['wawf'] = "The Washington Area Women's Foundation!";

		if ( Cookies != undefined) {
			var cookies = Cookies.getJSON('rp3.rptree');
			if ( cookies.player.lastScore != undefined ) {
				$('#this-round').html(cookies.player.lastScore);
			}
			if ( cookies.player.highScore != undefined ) {
				$('#player-high').html(cookies.player.highScore);
			}
			if ( cookies.player.charity != undefined ) {
				$('#thank-you').html(thankYou + charities[cookies.player.charity]);
			}
		}
	}

	/*function getHighScore() {
		$.getJSON("https://rptree.com/api/highest", function( data ) {
			console.log(data);
		});
	}*/

	rptree.init();
	leaderboardStats();
	//getHighScore();
}());
