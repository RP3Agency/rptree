var RPYeti = RPYeti || {};

RPYeti.controls = (function() {
	var self;

	var PI_2 = Math.PI / 2.0,
		TYPE = { DEFAULT: 0, MOUSELOOK: 1, POINTERLOCK: 2, ORIENTATION: 3 },
		ACTION = { FIRE: 'isFiring', MOVEUP: 'isLookUp', MOVEDOWN: 'isLookDown', MOVELEFT: 'isPanLeft', MOVERIGHT: 'isPanRight', HALFSPEED: 'isHalfSpeed' };

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
				document.addEventListener('mousemove', _.debounce(function( event ) {
					if( self.controlType != TYPE.MOUSELOOK ) {
						return;
					}
					self.state.isPanLeft = self.state.isPanRight = false;
					self.state.isLookUp = self.state.isLookDown = false;
					self.state.isHalfPan = self.state.isHalfLook = false;
					if( ! self.isHooked ) {
						if( event.pageX < window.innerWidth * 0.45 ) {
							self.state.isPanLeft = true;
							if( event.pageX > window.innerWidth * 0.3 ) {
								self.state.isHalfPan = true;
							}
						} else if ( event.pageX > window.innerWidth * 0.55 ) {
							self.state.isPanRight = true;
							if( event.pageX < window.innerWidth * 0.7 ) {
								self.state.isHalfPan = true;
							}
						}
						if( event.pageY < window.innerHeight * 0.45 ) {
							self.state.isLookUp = true;
							if( event.pageY > window.innerHeight * 0.3 ) {
								self.state.isHalfLook = true;
							}
						} else if ( event.pageY > window.innerHeight * 0.55 ) {
							self.state.isLookDown = true;
							if( event.pageY < window.innerHeight * 0.7 ) {
								self.state.isHalfLook = true;
							}
						}
					}
				}), 100);
				document.addEventListener('mouseout', function( event ) {
					if( self.controlType != TYPE.DEFAULT ) {
						return;
					}
					self.state.isPanLeft = self.state.isPanRight = false;
					self.state.isLookUp = self.state.isLookDown = false;
					self.state.isHalfPan = self.state.isHalfLook = false;
				});
			}
		},

		initMouseFire: function() {
			this.publisher.on('mousedown', function(e) {
				self.state.isFiring = true;
				e.preventDefault();
			})
			.on('mouseup', function(e) {
				self.state.isFiring = false;
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
				if ( element === ( document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement ) ) {
console.log('pointer lock enabled');
					self.controlType = TYPE.POINTERLOCK;
					self.state.isPanLeft = self.state.isPanRight = false;
					self.state.isLookUp = self.state.isLookDown = false;
					if( self.dialog.resume ) {
						self.dialog.resume.dismiss();
						self.dialog.resume = null;
					}
				} else {
console.log('pointer lock disabled');
					self.controlType = TYPE.DEFAULT;
					if( ! self.isHooked ) {
						self.dialog.resume = new RPYeti.Dialog(self, self.camera, self.game.stereo);
						self.dialog.resume.show( RPYeti.config.text.dialog.resumePlay, function() {
							if( self.controlType == TYPE.DEFAULT ) {
console.log('attempting pointer lock');
								self.initFullscreen( function() {
									if( document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled ) {
										element.requestPointerLock();
									} else {
										self.controlType = TYPE.DEFAULT;
									}
								});
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
				self.controlType = TYPE.DEFAULT;
			});

			self.initFullscreen( function() {
				if( document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled ) {
					element.requestPointerLock();
				}
			});
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
			$(document).on('webkitfullscreenerror mozfullscreenerror fullscreenerror', function( event ) {
				console.log( 'fullscreen error ', event );
				self.controlType = TYPE.MOUSELOOK;
			});
			if( cb ) {
				$(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', cb);
			}
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
				// reset camera mount rotation
				self.camera.rotation.set( 0, 0, 0 );
				self.yawGimbal.rotation.set( 0, 0, 0 );
				self.pitchGimbal.rotation.set( 0, 0, 0 );

				self.controls = new THREE.DeviceOrientationControls( self.yawGimbal, true );
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

			if( ! self.isHooked ) {
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

		getCamera: function() {
			return self.yawGimbal;
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
