/**
 * rptree custom JavaScript
 */

/* global rptree:true */

// Define our "rptree" object, if not already defined
if ( rptree === undefined ) { var rptree = {}; }

/**
 * Breakpoints, which are primary properties of the "rptree" object
 * These need to be updated when/if the Sass breakpoints change: [path TK]
 */
rptree.bpSmall	= window.matchMedia( '( min-width: ' + ( 321 / 16 ) + 'em' ).matches;
rptree.bpMedium	= window.matchMedia( '( min-width: ' + ( 680 / 16 ) + 'em' ).matches;
rptree.bpLarge	= window.matchMedia( '( min-width: ' + ( 1000 / 16 ) + 'em' ).matches;
rptree.bpXLarge	= window.matchMedia( '( min-width: ' + ( 1600 / 16 ) + 'em' ).matches;


/**
 * rptree.global
 * jQuery for fun and profit.
 */
rptree.global = (function($) {
	'use strict';

	var

	/**
	 * masonry layout for tweets
	 * http://masonry.desandro.com/
	 */
	masonry = function() {

		// breakpoint medium and up

		var $pageTweets = $('#page__tweets');

		if ( $pageTweets.length > 0 ) {

			$pageTweets.imagesLoaded( function() {
				$pageTweets.masonry({
					columnWidth: '.tweet',
					itemSelector: '.tweet',
					gutter: '.masonry-gutter',
					stamp: ".page__video"
				});
			});
		}
	},

	fitVids = function() {
		$('#page__video').fitVids();
	},

	init = function() {
		masonry();
		fitVids();

		$(window).on( 'scroll', function() {
			// Do something else.
		});

		$(window).on( 'resize', function() {
			// Do another thing.
		});
	};

	return {
		init:init
	};

}(jQuery));

(function() {
	'use strict';
	rptree.global.init();
}());
