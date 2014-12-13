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

	fitVids = function() {
		$('#page__video').fitVids();
	},

	/**
	 * sundown
	 * adjust the class on the screen depending on the time of day.
	 * of course.
	 */
	sundown = function() {

		var date = new Date(),
			hour = date.getHours(),
			$html = $('html.screen');

		if ($html.length > 0) {
			if ( (hour > 6) && (hour < 16) ) {
				$html.removeClass('night').addClass('day');
			} else {
				$html.removeClass('day').addClass('night');
			}
		}
	},

	/**
	 * pagePosition
	 * Set the position of the page relative to the size of the banner
	 */
	pagePosition = function() {
		var $page = $('#page'),
			$top  = $('#top'),
			topHeightInEms,
			breakpointLg = ( 1120 / 16 ) + 'em';

		if ( window.matchMedia('(min-width: ' + breakpointLg + ')').matches ) {
			// Figure out the top height (with a little margin) in rems
			topHeightInEms = ( $top.outerHeight() / 21 ) + 1;
			topHeightInEms = topHeightInEms + 'rem';

			$page.css('top', topHeightInEms);
		} else {
			$page.css('top', 'auto');
		}
	},

	init = function() {
		sundown();
		fitVids();
		pagePosition();

		setInterval(sundown, 60000);

		$(window).on( 'resize', function() {
			pagePosition();
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
			if(first && (this.firstTweetID === null || first.get('id') > this.firstTweetID)) {
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
			if(last && (this.lastTweetID === null || last.get('id') < this.lastTweetID)) {
				this.lastTweetID = last.get('id');
			}
			return this.lastTweetID;
		},
		url: function() {
			var url = 'http://' + location.host + '/feed';
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
			if (microsite) {
				$(window).scroll(this.checkScroll);
			}
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

			if(this.isLoading) {
				return this;
			}
			this.isLoading = true;
			if(refresh) {
				this.tweetsCollection.isUpdating = true;
			}
			this.tweetsCollection.fetch({
				success: function(tweets) {
					var content = $( tweetTemplate({ tweets: tweets.models }) );

					if ( screen && tweets.models.length) {
						that.$el.html(content);
					}

					if ( microsite ) {
						if(refresh) {
							content.insertBefore($('.tweet:first()', that.$el));
							that.$el.masonry('prepended', content);
						} else {
							that.$el.append(content);
							if(that.isAppending) {
								that.$el.masonry('appended', content);
							} else {
								that.$el.masonry({
									columnWidth: '.tweet',
									itemSelector: '.tweet',
									gutter: '.masonry-gutter',
									stamp: ".page__video"
								});
								that.$el.imagesLoaded(function() {
									that.$el.masonry();
								});
								that.isAppending = true;
								that.tweetsCollection.firstTweetID = tweets.first().get('id');
								that.tweetsCollection.lastTweetID = tweets.last().get('id');
							}
						}
						content.find('.tweet__timestamp').prettyDate();
					}

					that.tweetsCollection.isUpdating = false;
					that.isLoading = false;
				},
				error: function() {
					// silently return to listening state
					that.tweetsCollection.isUpdating = false;
					that.isLoading = false;
				}
			});

			return this;
		},
		events: {
			'scroll': 'checkScroll'
		},
		checkScroll: _.debounce(function() {
			if( !this.isLoading && ($(window).scrollTop() + $(window).height() > $(document).height() - 100) ) {
				this.loadResults();
			}
		}, 100)
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
