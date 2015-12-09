// * global rptree:true */

// Define our "rptree" object, if not already defined
//if ( rptree === undefined ) { var rptree = {}; }

/**
 * rptree.backbone
 * Backbone all the things!
 */
// rptree.backbone = (function($, _, Backbone) {

// 	'use strict';

// 	// Determine if we're on the microsite or the screen page

// 	var microsite, screen;

// 	if ( $('html').hasClass('screen') ) {
// 		microsite = false;
// 		screen = true;
// 	} else {
// 		microsite = true;
// 		screen = false;
// 	}

// 	// Cache the tweet template for reuse
// 	var tweetTemplate = _.template( $("#tweet-template").html() ),

// 	/**
// 	 * Backbone Classes
// 	 */

// 	/** Tweet model */
// 	TweetModel = Backbone.Model.extend(),

// 	/** Tweets Collection */
// 	TweetsCollection = Backbone.Collection.extend({
// 		isUpdating: false,
// 		firstTweetID: null,
// 		lastTweetID: null,
// 		url: function() {
// 			var url = 'http://' + location.host + '/feed';
// 			var params = this.isUpdating ? { since: this.firstTweetID } : { priorTo: this.lastTweetID };
// 			if(screen) {
// 				params.limit = 1;
// 			}
// 			if(_.any(params, _.identity)) {
// 				url += '?' + $.param(_.pick(params, _.identity));
// 			}
// 			return url;
// 		},
// 		model: TweetModel
// 	}),

// 	/** TweetListView */
// 	TweetListView = Backbone.View.extend({
// 		el: "#page__tweets",
// 		initialize: function() {
// 			_.bindAll(this, 'checkScroll', 'refresh');
// 			if (microsite) {
// 				$(window).scroll(this.checkScroll);
// 			}
// 			this.timer = setInterval(this.refresh, 5000);
// 			this.isLoading = false;
// 			this.isAppending = false;
// 			this.tweetsCollection = new TweetsCollection();
// 			this.render();
// 		},
// 		render: function() {
// 			this.loadResults();
// 		},
// 		refresh: function() {
// 			this.loadResults(true);
// 		},
// 		loadResults: function(refresh) {
// 			var that = this;

// 			if(this.isLoading) {
// 				return this;
// 			}
// 			this.isLoading = true;
// 			if(refresh) {
// 				this.tweetsCollection.isUpdating = true;
// 			}
// 			this.tweetsCollection.fetch({
// 				success: function(tweets) {
// 					var content = $( tweetTemplate({ tweets: tweets.models }) );

// 					if ( screen && tweets.models.length) {
// 						that.$el.html(content);
// 					}

// 					if ( microsite ) {
// 						if(refresh) {
// 							content.insertBefore($('.tweet:first()', that.$el));
// 							that.$el.masonry('prepended', content);
// 						} else {
// 							that.$el.append(content);
// 							if(that.isAppending) {
// 								that.$el.masonry('appended', content);
// 							} else {
// 								that.$el.masonry({
// 									columnWidth: '.tweet',
// 									itemSelector: '.tweet',
// 									gutter: '.masonry-gutter',
// 									stamp: ".page__video"
// 								});
// 								that.isAppending = true;
// 							}
// 						}
// 						that.$el.imagesLoaded(function() {
// 							that.$el.masonry();
// 						});
// 						content.find('.tweet__timestamp').prettyDate();
// 					}

// 					var those = that.tweetsCollection;
// 					if(tweets.models.length) {
// 						if(those.firstTweetID === null || tweets.first().get('id') > those.firstTweetID) {
// 							those.firstTweetID = tweets.first().get('id');
// 						}
// 						if(those.lastTweetID === null || tweets.last().get('id') < those.lastTweetID) {
// 							those.lastTweetID = tweets.last().get('id');
// 						}
// 					}
// 					those.isUpdating = false;
// 					that.isLoading = false;
// 				},
// 				error: function() {
// 					// silently return to listening state
// 					that.tweetsCollection.isUpdating = false;
// 					that.isLoading = false;
// 				}
// 			});

// 			return this;
// 		},
// 		events: {
// 			'scroll': 'checkScroll'
// 		},
// 		checkScroll: _.debounce(function() {
// 			if( !this.isLoading && ($(window).scrollTop() + $(window).height() > $(document).height() - 100) ) {
// 				this.loadResults();
// 			}
// 		}, 100)
// 	}),

// 	/**
// 	 * Backbone Objects
// 	 */

// 	init = function() {
// 	};

// 	return {
// 		init:init,
// 		tweetListView: new TweetListView()
// 	};

// }(jQuery, _, Backbone));

// (function() {
// 	'use strict';
// 	rptree.backbone.init();
// }());
