var RPYeti = RPYeti || {};

RPYeti.controls = (function() {
	var self;

	var PI_2 = Math.PI / 2.0,
		TYPE = { DEFAULT: 0, MOUSELOOK: 1, POINTERLOCK: 2, ORIENTATION: 3 },
		ACTION = { FIRE: 'isFiring', PAUSE: 'isPausing', MOVEUP: 'isLookUp', MOVEDOWN: 'isLookDown', MOVELEFT: 'isPanLeft', MOVERIGHT: 'isPanRight', HALFSPEED: 'isHalfSpeed' };

	return {

		/** Public Properties **/
		isHooked: false,
		state: {},
		keyMap: {},
		controlType: TYPE.DEFAULT,
		publisher: $(document),
		dialog: {},

		yawGimbal: new THREE.Object3D(),
		pitchGimbal: new THREE.Object3D(),

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

			// mount camera on gimbals
			this.pitchGimbal.add( this.camera );
			this.yawGimbal.position.y = RPYeti.config.camera.height;
			this.yawGimbal.rotation.y = RPYeti.config.camera.yaw;
			this.yawGimbal.add( this.pitchGimbal );
			this.game.scene.add( this.yawGimbal );

			// initialize control schemes
			this.initOrientation();
			this.initPointerLock();
			this.initMouseFire();
			this.initKeys();
			this.initTouch();
			this.initMouseLook();

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
					if( self.state.isPausing && ! self.isHooked && self.controlType == TYPE.MOUSELOOK ) {
						self.dialog.resume = new RPYeti.Dialog(self, self.camera, self.game.stereo);
						self.dialog.resume.show( RPYeti.config.text.dialog.resumePlay, function() {
							self.dialog.resume = null;
						});
					}

					self.state[ ACTION[ self.keyMap[ e.keyCode ] ] ] = false;

					if( self.isHooked && self.keyMap[ e.keyCode ] == 'FIRE' ) {
						self.hook();
					}
				} else  {
					e.preventDefault();
				}
				self.checkCodes( e.keyCode );
			});
		},

		initMouseLook: function() {
			if( self.controlType == TYPE.MOUSELOOK ) {
				document.addEventListener('mousemove', function( event ) {
					if( self.controlType != TYPE.MOUSELOOK ) {
						return;
					}
					if( self.state.isFiring && ! self.isHooked ) {
						self.state.isFiring = false;
						self.state.isMoving = true;
					}
					if( self.state.isMoving ) {
						var movementX = event.screenX - self.lastX;
						var movementY = event.screenY - self.lastY;
						self.yawGimbal.rotation.y -= movementX * RPYeti.config.controls.lookSpeed.y;
						self.pitchGimbal.rotation.x -= movementY * RPYeti.config.controls.lookSpeed.x;
						self.pitchGimbal.rotation.x = Math.max( - PI_2, Math.min( PI_2, self.pitchGimbal.rotation.x ) );
						self.lastX = event.screenX;
						self.lastY = event.screenY;
					}
				});
			}
		},

		initMouseFire: function() {
			this.publisher.on('mousedown', function(e) {
				self.state.isFiring = true;
				self.state.isMoving = false;
				self.lastX = event.screenX;
				self.lastY = event.screenY;
				e.preventDefault();
			})
			.on('mouseup', function(e) {
				self.state.isFiring = false;
				self.state.isMoving = false;
				e.preventDefault();

				if( self.isHooked ) {
					self.hook();
				}
			})
			.on('contextMenu', function(e) {
				e.preventDefault();
			});
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

				if( self.isHooked ) {
					self.hook();
				}
			});
		},

		initPointerLock: function() {
			var pointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
			if( self.controlType == TYPE.ORIENTATION ) {
				return;
			} else if ( ! pointerLock ) {
				self.controlType = TYPE.MOUSELOOK;
				return;
			}
			var element = document.body,
				prefix = ( document.mozPointerLockElement === null ) ? 'mozpointerlock' : ( ( document.webkitPointerLockElement === null ) ? 'webkitpointerlock' : 'pointerlock' );
			element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

			document.addEventListener( prefix + 'change', function( event ) {
				if( self.controlType == TYPE.ORIENTATION ) {
					return;
				}
				if ( element === ( document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement ) ) {
					self.controlType = TYPE.POINTERLOCK;
					if( ! ( document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled ) ) {
						self.initFullscreen();
					}
					self.state.isPanLeft = self.state.isPanRight = false;
					self.state.isLookUp = self.state.isLookDown = false;
					if( self.dialog.resume ) {
						self.dialog.resume.dismiss();
						self.dialog.resume = null;
					}
				} else {
					self.controlType = TYPE.DEFAULT;
					if( ! self.isHooked ) {
						self.dialog.resume = new RPYeti.Dialog(self, self.camera, self.game.stereo);
						self.dialog.resume.show( RPYeti.config.text.dialog.resumePlay, function() {
							if( self.controlType == TYPE.DEFAULT ) {
								self.initScreenLock();
							}
						});
					}
				}
			});

			document.addEventListener('mousemove', function( event ) {
				if( self.controlType != TYPE.POINTERLOCK ) {
					return;
				}
				var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
				var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
				self.yawGimbal.rotation.y -= movementX * RPYeti.config.controls.mouseSpeed;
				self.pitchGimbal.rotation.x -= movementY * RPYeti.config.controls.mouseSpeed;
				self.pitchGimbal.rotation.x = Math.max( - PI_2, Math.min( PI_2, self.pitchGimbal.rotation.x ) );
			});

			document.addEventListener( prefix + 'error', function( event ) {
				if( self.controlType != TYPE.ORIENTATION ) {
					self.controlType = TYPE.DEFAULT;
				}
			});

			self.initScreenLock();

		},

		initFullscreen: function(cb) {
			var element = self.game.container || document.body;
			if ( element.requestFullscreen ) {
				element.requestFullscreen();
			} else if ( element.msRequestFullscreen ) {
				element.msRequestFullscreen();
			} else if ( element.mozRequestFullScreen ) {
				element.mozRequestFullScreen();
			} else if ( element.webkitRequestFullscreen ) {
				element.webkitRequestFullscreen();
			}
			$(document).on('fullscreenerror webkitfullscreenerror mozfullscreenerror ', function( event ) {
				if( self.controlType != TYPE.ORIENTATION ) {
					self.controlType = TYPE.MOUSELOOK;
				}
			});
			if( cb ) {
				$(document).on('fullscreenchange webkitfullscreenchange mozfullscreenchange', cb);
			}
		},

		initScreenLock: function() {
			self.initFullscreen(function() {
				if( self.controlType != TYPE.POINTERLOCK && document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled ) {
					document.body.requestPointerLock();
				}
			});
			document.body.requestPointerLock();
		},

		initOrientation: function() {
			var setOrientationControls = function(e) {
				if (!e.alpha) {
					return;
				}
				self.controlType = TYPE.ORIENTATION;
				window.removeEventListener('deviceorientation', setOrientationControls, true);

				if( self.controls ) {
					self.controls.dispose();
				}
				// unmount camera and add directly to scene
				self.game.scene.remove( self.yawGimbal );
				self.pitchGimbal.remove( self.camera );
				self.game.scene.add( self.camera );
				self.camera.position.y = RPYeti.config.camera.height;
				self.camera.rotation.y = RPYeti.config.camera.yaw;

				self.controls = new THREE.DeviceOrientationControls( self.camera, true );
				self.controls.connect();
				self.controls.update();

				//self.element.addEventListener('click', self.initFullscreen, false);
			}
			window.addEventListener('deviceorientation', setOrientationControls, true);
		},

		update: function(delta) {
			if( self.controls ) {
				self.controls.update( delta );
			}

			if( self.controlType != TYPE.ORIENTATION && ! self.isHooked ) {
				var dx = RPYeti.config.controls.keySpeed.x * delta * ( ( self.state.isHalfSpeed || self.state.isHalfLook ) ? 0.5 : 1 ) * ( ( self.state.isLookUp ? 1 : 0 ) + ( self.state.isLookDown ? -1 : 0 ) ),
					dy = RPYeti.config.controls.keySpeed.y * delta * ( ( self.state.isHalfSpeed || self.state.isHalfPan ) ? 0.5 : 1 ) * ( ( self.state.isPanLeft ? 1 : 0 ) + ( self.state.isPanRight ? -1 : 0 ) );

				self.yawGimbal.rotation.y += dy;
				self.pitchGimbal.rotation.x += dx;
				self.pitchGimbal.rotation.x = Math.max( - PI_2, Math.min( PI_2, self.pitchGimbal.rotation.x ) );
			}
		},

		getDirection: function() {
			if( self.controlType == TYPE.ORIENTATION ) {
				return self.camera.getWorldDirection();
			}
			var direction = new THREE.Vector3( 0, 0, -1 ),
		    	rotation = new THREE.Euler( 0, 0, 0, 'YXZ' ),
				vector = self.yawGimbal.position.clone();

			rotation.set( self.pitchGimbal.rotation.x, self.yawGimbal.rotation.y, 0 );
		    vector.copy( direction ).applyEuler( rotation )
		    return vector;
		},

		setHook: function (hook) {
			if (typeof hook === 'function') {
				this.hook = hook;
				this.isHooked = true;
			} else {
				delete this.hook;
				this.isHooked = false;
			}
		},

		checkCodes: function( key ) {
			self.code = self.code || [];
			self.code.push( key );
			var flag = false, i = self.code.length - 1;
			$.each( RPYeti.config.controls.codes, function( action, code ) {
				if( code[ i ] == self.code[ i ] ) {
					if( code.length == self.code.length ) {
						self.code = [];
						switch( action ) {
							case 'KONAMI':
								self.game.gameplay.start(1000, false);
								setTimeout(function() {
									self.game.hud.addText('ALL YOUR YETI\nARE BELONG TO US!!');
									var wilhelm = new THREE.Audio( self.game.listener );
									wilhelm.setBuffer( RPYeti.loader.sounds.wilhelm );
									wilhelm.setVolume( RPYeti.config.audio.pointblankVolume );
									self.game.listener.add( wilhelm );
									wilhelm.play();
								}, 275);
								break;
							case 'STARFOXZ':
								var barrelRollTween = new TWEEN.Tween({ angle: self.camera.rotation.z })
									.easing( TWEEN.Easing.Linear.None )
									.onUpdate(function () {
										self.camera.rotation.z = this.angle;
									}).onComplete(function () {
										self.camera.rotation.z = 0;
									});
									barrelRollTween.to({ angle: 2 * Math.PI }, 1000 ).start();
								break;
							case 'STARFOXR':
								var barrelRollTween = new TWEEN.Tween({ angle: self.camera.rotation.z })
									.easing( TWEEN.Easing.Linear.None )
									.onUpdate(function () {
										self.camera.rotation.z = this.angle;
									}).onComplete(function () {
										self.camera.rotation.z = 0;
									});
									barrelRollTween.to({ angle: - 2 * Math.PI }, 1000 ).start();
								break;
						}
					} else {
						flag = true;
					}
				}
			});
			if ( ! flag ) {
				self.code = [];
			}
		},

	};

})();
