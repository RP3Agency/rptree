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
			this.publisher.on( 'rpyeti.music.start', this.start );


			//load all loops into audio objects, set them all to loop, mute them and start them playing
			//as all loops are the same length, the trick then becomes cutting on a phrase, so the harmony makes sense
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
				}

			});

			//establish an empty play queue
			self.queuedForPlay = null;

		},

		start: function () {
			if (self.phraseMonitor === undefined) {
				self.startAllTracks();
				self.phraseSwitch();
			}
		},

		startAllTracks: function () {
			self.phraseMonitor = window.setInterval(self.phraseSwitch, 9600);
			for ( var i in self.loops ) {
				self.loops[i].play();
			}
		},

		//below, per track, schedule the crossfade...

		treeSelection: function (event, callback) {
			self.queuePlay(self.loops.treeSelection, callback);
		},

		treeTheft: function (event, callback) {
			self.queuePlay(self.loops.treeTheft, callback);
		},

		snowballFight: function (event, callback) {
			self.queuePlay(self.loops.snowballFight, callback);
		},

		snowballFightL: function (event, callback) {
			self.playNow(self.loops.snowballFightL, callback);
		},

		levelWin: function (event, callback) {
			self.queuePlay(self.loops.levelWin, callback);
		},

		levelLose: function (event, callback) {
			self.queuePlay(self.loops.levelLose, callback);
		},

		//loop through the loops and mute all of them
		muteAll: function (event, callback) {
			for (var i in self.loops) {
				self.loops[i].setVolume(0);
			}
		},

		//queue crossfade for the next phrase start
		//this all only works because all loops are 4 bars long at 100bpm, meaning 9600 ms per phrase (or loop)
		queuePlay: function (loop, callback) {
			self.queuedForPlay = { loop: loop, callback: callback };
		},

		//fade without waiting - low health and regular theme are written to be crossfaded immediately
		playNow: function (loop) {
			self.muteAll();
			loop.setVolume(RPYeti.config.audio.musicVolume);
		},

		phraseSwitch: function () {
			if (self.queuedForPlay != null) {

				self.muteAll();
				self.queuedForPlay.loop.setVolume(RPYeti.config.audio.musicVolume);

				if (typeof self.queuedForPlay.callback === 'function') {
					self.queuedForPlay.callback();
				}

				self.queuedForPlay = null;
			}
		},
		//for future better sync'd timing
		getCurrentTime: function () {
			return self.listener.context.currentTime;
		}


	};

})();

$(function() {

	RPYeti.music.init();

});
