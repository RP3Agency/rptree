/* global rptree:true, Cookies:false */

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

	leaderboard = function() {
		if ($('main').hasClass('leaderboard')) {
			var thankYou = 'Thank you for supporting ';
			var charities = {};
				charities.cn = "Children's National Health System!";
				charities.ja = "Junior Achievement of Greater Washington!";
				charities.wawf = "Washington Area Women's Foundation!";

			if ( Cookies !== undefined) {
				var cookies = Cookies.getJSON('rp3.rptree');

				if ( typeof( cookies ) === 'undefined' || typeof( cookies.player ) === 'undefined' || typeof( cookies.player.charity ) === 'undefined' ) {
					location.href = '/';
				}

				if ( cookies.player.lastScore !== undefined ) {
					$('.score').html(cookies.player.lastScore);
					var childrens = '%40childrenshealth',
					wawf = '%40TheWomensFndtn',
					junior = '%40JA_GW',
					chosen = '';

					if ( cookies.player.charity == 'cn' ) {
						chosen = childrens;
					} else if ( cookies.player.charity == 'wawf' ) {
						chosen = wawf;
					} else {
						chosen = junior;
					}

				var href= 'https://twitter.com/intent/tweet?text=I%20defeated%20'+cookies.player.lastScore+'%20yetis%20and%20supported%20'+chosen+'.%20Join%20the%20fight!%20%23rptree%20rptree.com';
				$('#twitter-share').attr('href', href);

				}
				if ( cookies.player.highScore !== undefined ) {
					$('#player-high').html(cookies.player.highScore);
				}
				if ( cookies.player.charity !== undefined ) {
					$('#thank-you').html(thankYou + charities[cookies.player.charity]);
				}
			}

			if (window.location.hash) {
				var button = $('#new-game');
				button.attr('href', button.attr('href') + window.location.hash);
			}
		}
	},

	getHighScore = function() {
		if( $('#high-score').length > 0 ) {
			$.getJSON("/api/highest", function( data ) {
				$('#high-score').html(data.highestScore);
			});
		}
	},

	init = function() {
		scrollToInstructions();
		desktopStyling();
		leaderboard();
		getHighScore();
	};

	return {
		init:init,
	};

}(jQuery));

(function() {
	'use strict';

	rptree.init();
}());
