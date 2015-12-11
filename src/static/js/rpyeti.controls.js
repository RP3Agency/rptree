var RPYeti = RPYeti || {};

RPYeti.controls = (function() {
	var self;

	var TYPE = { DEFAULT: 0, MOUSEOVER: 1, POINTERLOCK: 2, ORIENTATION: 3 },
		ACTION = { FIRE: 'isFiring', MOVEUP: 'isLookUp', MOVEDOWN: 'isLookDown', MOVELEFT: 'isPanLeft', MOVERIGHT: 'isPanRight' };

	return {

		/** Public Properties **/
		state: {},
		keyMap: {},
		controlType: TYPE.DEFAULT,
		publisher: $(document),

		/** Constructor **/

		init: function(game) {
			self = this;

			// clear all states
			for( var action in ACTION ) {
				this.state[ ACTION[ action ] ] = false;
			}

			// build keymap from config
			for( var key in RPYeti.config.controls.keys ) {
				var codes = RPYeti.config.controls.keys[ key ];
				for( var code in codes ) {
					this.keyMap[ codes[ code ] ] = key;
				}
			}

			// attach to game object
			this.game = game;
			this.element = this.game.renderer.domElement;
			this.camera = this.game.camera;

			// initialize control schemes
			this.initOrientation();
			this.initPointerLock();
			this.initMouseLook();
			this.initKeys();
			this.initTouch();

			return this;
		},

		initKeys: function() {
			this.publisher.on('keydown', function(e) {
				if ( e.altKey ) {
					return;
				}
				if( self.keyMap[ e.keyCode ] ) {
					self.state[ ACTION[ self.keyMap[ e.keyCode ] ] ] = true;
				} else  {
					e.preventDefault();
				}
			})
			.on('keyup', function(e) {
				if( self.keyMap[ e.keyCode ] ) {
					self.state[ ACTION[ self.keyMap[ e.keyCode ] ] ] = false;
				} else  {
					e.preventDefault();
				}
			});
		},

		initMouseLook: function() {

		},

		initTouch: function() {
			this.publisher.on('touchstart', function(e) {
				self.state.isFiring = true;
				e.preventDefault();
			})
			.on('touchmove', function(e) {
				e.preventDefault();
			})
			.on('touchend', function(e) {
				self.state.isFiring = false;
				e.preventDefault();
			});
		},

		initPointerLock: function() {

		},

		initOrientation: function() {
			var setOrientationControls = function(e) {
				if (!e.alpha) {
					return;
				}
				this.controlType = TYPE.ORIENTATION;
				window.removeEventListener('deviceorientation', setOrientationControls, true);

				if( self.controls ) {
					self.controls.dispose();
				}
				self.controls = new THREE.DeviceOrientationControls( self.camera, true );
				self.controls.connect();
				self.controls.update();

				self.element.addEventListener('click', self.game.fullscreen, false);
			}
			window.addEventListener('deviceorientation', setOrientationControls, true);
		},

		update: function(delta) {
			if( self.controls ) {
				self.controls.update( delta );
			}

			var dx			= ( self.state.isLookUp ? 1 : 0 ) + ( self.state.isLookDown ? -1 : 0 ),
				dy			= ( self.state.isPanLeft ? 1 : 0 ) + ( self.state.isPanRight ? -1 : 0 ),
				rotateSpeed = RPYeti.config.controls.keySpeed * delta,
				quaternion	= new THREE.Quaternion( dx * rotateSpeed, dy * rotateSpeed, 0, 1 ).normalize();

			self.camera.quaternion.multiply( quaternion );
			self.camera.rotation.setFromQuaternion( self.camera.quaternion, self.camera.rotation.order );

		},

	};

})();
