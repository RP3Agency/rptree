var RPYeti = RPYeti || {};

RPYeti.service = (function() {
	var self;

	return {
		player: null,

		init: function() {
			// save singleton context
			self = this;

			// save global event publisher (document)
			this.publisher = $(document);

			// get RPTree cookie
			var cookie = Cookies.getJSON( 'rp3.rptree' );

			// if no cookie, generate UUID and set cookie
			if( cookie && cookie.player ) {
				self.player = cookie.player;
			} else {
				self.player = {
					highScore: 0,
					browser: navigator.userAgent,
				};
				self.savePlayer();
			}

			// add listeners to catch game events and report to server
			this.publisher.on('rpyeti.game.score', function( ev, score ) {
				if( ! self.player.highScore || self.player.highScore < score) {
					self.player.highScore = score;
					self.savePlayer();
				}
			});

		},

		// save player object to server and store in cookie
		savePlayer: function() {
			$.getJSON( '/api/player', self.player, function( player ) {
				Cookies.set( 'rp3.rptree', { player: player }, { expires: 365, secure: true } );
				self.player = player;
			});
		},


	};

})();

$(function() {

	RPYeti.service.init();

});
