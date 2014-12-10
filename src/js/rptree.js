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

		if ( ( $pageTweets.length > 0 ) && ( ! $('html').hasClass('screen') ) ) {

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

/**
 * rptree.backbone
 * Backbone all the things!
 */
rptree.backbone = (function($, _, Backbone) {

	'use strict';

	// Determine if we're on the microsite or the screen page

	var microsite, screen;

	if ( $('html').hasClass('screen') ) {
		microsite = false;
		screen = true;
	} else {
		microsite = true;
		screen = false;
	}


	// Set up our variables accordingly
	var url = 'http://rptree.com/feed';

	if ( screen ) {
		url = url + '?limit=1';
	}

	var	$pageTweets = $('#page__tweets'),

	/**
	 * Backbone Classes
	 */
	
	/** Tweet model */
	TweetModel = Backbone.Model.extend(),

	/** Tweets Collection */
	TweetsCollection = Backbone.Collection.extend({
		url: url,
		model: TweetModel
	}),

	/** TweetListView */
	TweetListView = Backbone.View.extend({
		el: "#page__tweets",
		render: function() {
			var that = this;

			tweetsCollection.fetch({
				success: function(tweets) {

					var template = _.template( $("#tweet-template").html() );
					that.$el.append( template({tweets: tweets.models}));

					if ( microsite ) {
						$pageTweets.masonry();
					}
				},
				error: function() {
					alert( 'oh, snap!' );
				}
			});

			return this;
		},
		initialize: function() {
			this.render();
		}
	}),

	/**
	 * Backbone Objects
	 */
	
	tweetsCollection = new TweetsCollection(),
	tweetListView = new TweetListView(),

	init = function() {
	};

	return {
		init:init,
		tweetListView:tweetListView
	};

}(jQuery, _, Backbone));

(function() {
	'use strict';
	rptree.global.init();
	rptree.backbone.init();
}());
