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

	// Cache the tweet template for reuse
	var tweetTemplate = _.template( $("#tweet-template").html() ),

	/**
	 * Backbone Classes
	 */

	/** Tweet model */
	TweetModel = Backbone.Model.extend(),

	/** Tweets Collection */
	TweetsCollection = Backbone.Collection.extend({
		isUpdating: false,
		firstTweetID: null,
		firstTweet: function() {
			if(!this.isUpdating) {
				return null;
			}
			var first = this.first();
			if(first && (first.get('id') > this.firstTweetID)) {
				this.firstTweetID = first.get('id');
			}
			return this.firstTweetID;
		},
		lastTweetID: null,
		lastTweet: function() {
			if(this.isUpdating) {
				return null;
			}
			var last = this.last();
			if(last) {
				this.lastTweetID = last.get('id');
			}
			return this.lastTweetID;
		},
		url: function() {
			var url = location.href + 'feed';
			var params = {
				priorTo: this.lastTweet(),
				since: this.firstTweet(),
			};
			if(screen) {
				params.limit = 1;
			}
			if(_.any(params, _.identity)) {
				url += '?' + $.param(_.pick(params, _.identity));
			}
			return url;
		},
		model: TweetModel
	}),

	/** TweetListView */
	TweetListView = Backbone.View.extend({
		el: "#page__tweets",
		initialize: function() {
			_.bindAll(this, 'checkScroll', 'refresh');
			$(window).scroll(this.checkScroll);
			this.timer = setInterval(this.refresh, 5000);
			this.isLoading = false;
			this.isAppending = false;
			this.tweetsCollection = new TweetsCollection();
			this.render();
		},
		render: function() {
			this.loadResults();
		},
		refresh: function() {
			this.loadResults(true);
		},
		loadResults: function(refresh) {
			var that = this;

			this.isLoading = true;
			if(refresh) {
				this.tweetsCollection.isUpdating = true;
			}
			this.tweetsCollection.fetch({
				success: function(tweets) {
					var content = $( tweetTemplate({ tweets: tweets.models }) );

					if(refresh) {
						content.insertBefore($('.tweet:first()', that.$el));
					} else {
						that.$el.append(content);
					}
					content.find('.tweet__timestamp').prettyDate();

					if ( microsite ) {
						if(refresh) {
							that.$el.masonry('prepended', content);
							that.tweetsCollection.isUpdating = false;
						} else if(that.isAppending) {
							that.$el.masonry('appended', content);
						} else {
							that.$el.masonry({
								columnWidth: '.tweet',
								itemSelector: '.tweet',
								gutter: '.masonry-gutter',
								stamp: ".page__video"
							});
							that.isAppending = true;
						}
					}

					that.isLoading = false;
				},
				error: function() {
					alert( 'oh, snap!' );
				}
			}, { remove: false });

			return this;
		},
		events: {
			'scroll': 'checkScroll'
		},
		checkScroll: _.debounce(function() {
			if( !this.isLoading && ($(window).scrollTop() + $(window).height() > $(document).height() - 100) ) {
				this.loadResults();
			}
		}, 0)
	}),

	/**
	 * Backbone Objects
	 */

	init = function() {
	};

	return {
		init:init,
		tweetListView: new TweetListView()
	};

}(jQuery, _, Backbone));

(function() {
	'use strict';
	rptree.global.init();
	rptree.backbone.init();
}());
