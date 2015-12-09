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
			this.listener = new THREE.AudioListener();

			// add listeners to catch game events and report to server
			this.publisher.on( 'rpyeti.music.selection', this.treeSelection );
			this.publisher.on( 'rpyeti.music.theft', this.treeTheft );
			this.publisher.on( 'rpyeti.music.fight', this.snowballFight );
			this.publisher.on( 'rpyeti.music.lowhealth', this.snowballFightL );
			this.publisher.on( 'rpyeti.music.win', this.levelWin );
			this.publisher.on( 'rpyeti.music.lose', this.levelLose );
			this.publisher.on( 'rpyeti.music.mute', this.muteAll );
			
			this.loops = {};
			
			this.publisher.on( 'rpyeti.loader.complete', function () {
				
				var loopList = {
					treeSelection: RPYeti.loader.sounds.music_tree_selection,
					treeTheft: RPYeti.loader.sounds.music_tree_theft,
					snowballFight: RPYeti.loader.sounds.music_snowball_fight,
					snowballFightL: RPYeti.loader.sounds.music_snowball_fight_low_health,
					levelWin: RPYeti.loader.sounds.music_level_win,
					levelLose: RPYeti.loader.sounds.music_level_lose
				};
				
				for ( var i in loopList ) {
					self.loops[i] = new THREE.Audio( self.listener );
					self.loops[i].setBuffer( loopList[i] );
					self.loops[i].setVolume(0);
					self.listener.add( self.loops[i] );
					self.loops[i].setLoop(true);
					self.loops[i].play();
				}
				
			});
			
		},

		treeSelection: function () {
			console.log('Music queue: Tree Selection');
			self.muteAll();
			self.queuePlay(self.loops.treeSelection);
		},

		treeTheft: function () {
			console.log('Music queue: Theft');
			self.muteAll();
			self.queuePlay(self.loops.treeTheft);
		},

		snowballFight: function () {
			console.log('Music queue: Fight');
			self.muteAll();
			self.queuePlay(self.loops.snowballFight);
		},

		snowballFightL: function () {
			console.log('Music queue: Low Health');
			self.muteAll();
			self.queuePlay(self.loops.snowballFightL);
		},

		levelWin: function () {
			console.log('Music queue: Win');
			self.muteAll();
			self.queuePlay(self.loops.levelWin);
		},

		levelLose: function () {
			console.log('Music queue: Lose');
			self.muteAll();
			self.queuePlay(self.loops.levelLose);
		},

		muteAll: function () {
			console.log('Music queue: Mute');
			for (var i in self.loops) {
				self.loops[i].setVolume(0);
			}
		},
		
		queuePlay: function (loop) {
			//todo - set loop to unmute at the next multiple of a loop (9.6 seconds), based on current time
			loop.setVolume(RPYeti.config.musicVolume);
		},
		
		getCurrentTime: function () {
			return self.listener.context.currentTime;
		}
		

	};

})();

$(function() {

	RPYeti.music.init();

});