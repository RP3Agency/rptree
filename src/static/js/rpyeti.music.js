var RPYeti = RPYeti || {};

RPYeti.music = (function() {
	var self;

	return {
		player: null,

		init: function() {
			// save singleton context
			self = this;

			// save global event publisher (document)
			this.publisher = $(document);

			// add listeners to catch game events and report to server
			this.publisher.on( 'rpyeti.music.selection', this.treeSelection );
			this.publisher.on( 'rpyeti.music.theft', this.treeTheft );
			this.publisher.on( 'rpyeti.music.fight', this.snowballFight );
			this.publisher.on( 'rpyeti.music.lowhealth', this.snowballFightL );
			this.publisher.on( 'rpyeti.music.win', this.levelWin );
			this.publisher.on( 'rpyeti.music.lose', this.levelLose );
			this.publisher.on( 'rpyeti.music.mute', this.muteAll );
		},

		treeSelection: function () {
			console.log('Music queue: Tree Selection');
		},

		treeTheft: function () {
			console.log('Music queue: Theft');
		},

		snowballFight: function () {
			console.log('Music queue: Fight');
		},

		snowballFightL: function () {
			console.log('Music queue: Low Health');
		},

		levelWin: function () {
			console.log('Music queue: Win');
		},

		levelLose: function () {
			console.log('Music queue: Lose');
		},

		muteAll: function () {
			console.log('Music queue: Mute');
		}

	};

})();

$(function() {

	RPYeti.music.init();

});