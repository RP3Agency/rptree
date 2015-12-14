// * global rptree:true */

// Define our "rptree" object, if not already defined
if ( rptree === undefined ) { var rptree = {}; }

/**
 * rptree.backbone
 * Backbone all the things!
 */
rptree.backbone = (function($, _, Backbone) {
	'use strict';

    // define template settings - use square-brackets for code to avoid EJS conflict
    _.templateSettings = {
        evaluate: /\[\[(.+?)\]\]/g,
        interpolate: /\[\[=(.+?)\]\]/g,
        escape: /\[\[-(.+?)\]\]/g,
    };

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
		lastTweetID: null,
		url: function() {
			var url = location.protocol + '//' + location.host + '/feed',
			    params = {
                    limit: 20,
                };
            if( this.isUpdating ) {
                params.since = this.firstTweetID;
            } else {
                params.priorTo = this.lastTweetID;
            }
			return url + '?' + $.param( params );
		},
		model: TweetModel
	}),

	/** TweetListView */
	TweetListView = Backbone.View.extend({
		el: "#tweets",
		initialize: function() {
			_.bindAll(this, 'checkScroll', 'refresh');
			//$(window).scroll(this.checkScroll);
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
							});
							that.isAppending = true;
						}
					}
					that.$el.imagesLoaded(function() {
						that.$el.masonry();
					});
					$.livestamp('update');

					var those = that.tweetsCollection;
					if(tweets.models.length) {
						if(those.firstTweetID === null || tweets.first().get('id') > those.firstTweetID) {
							those.firstTweetID = tweets.first().get('id');
						}
						if(those.lastTweetID === null || tweets.last().get('id') < those.lastTweetID) {
							those.lastTweetID = tweets.last().get('id');
						}
					}
					those.isUpdating = false;
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
	rptree.backbone.init();
}());
