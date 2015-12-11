var RPYeti = RPYeti || {};

RPYeti.controls = (function() {
	var self;

	var PI_2 = Math.PI / 2.0,
		TYPE = { DEFAULT: 0, MOUSEOVER: 1, POINTERLOCK: 2, ORIENTATION: 3 },
		ACTION = { FIRE: 'isFiring', MOVEUP: 'isLookUp', MOVEDOWN: 'isLookDown', MOVELEFT: 'isPanLeft', MOVERIGHT: 'isPanRight' };

	return {

		/** Public Properties **/
		state: {},
		keyMap: {},
		controlType: TYPE.DEFAULT,
		publisher: $(document),

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
			this.initMouseLook();
			this.initMouseFire();
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

		initMouseFire: function() {
			this.publisher.on('mousedown', function(e) {
				self.state.isFiring = true;
				e.preventDefault();
			})
			.on('mouseup', function(e) {
				self.state.isFiring = false;
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
			});
		},

		initPointerLock: function() {
			var pointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
			if( self.controlType == TYPE.ORIENTATION || ! pointerLock ) {
				return;
			}
			var element = document.body,
				prefix = ( document.mozPointerLockElement === null ) ? 'mozpointerlock' : ( ( document.webkitPointerLockElement === null ) ? 'webkitpointerlock' : 'pointerlock' );
			element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

			document.addEventListener( prefix + 'change', function( event ) {
				if ( element === ( document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement ) ) {
					self.controlType = TYPE.POINTERLOCK;
					//TODO: wire up camera controls
					console.log('pointer lock engaged');
				} else {
					self.controlType = TYPE.DEFAULT;
					//TODO: hook into the click event to re-engage lock
					console.log('pointer lock disengaged');
				}
			});
			document.addEventListener( prefix + 'error', function( event ) {
				console.log( 'pointerlock error ', event);
			});
			this.publisher.one('click', function() {
				element.requestPointerLock();
			});
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

			var dx			= ( self.state.isLookUp ? 1 : 0 ) + ( self.state.isLookDown ? -1 : 0 ),
				dy			= ( self.state.isPanLeft ? 1 : 0 ) + ( self.state.isPanRight ? -1 : 0 ),
				rotateSpeed = RPYeti.config.controls.keySpeed * delta;

			self.yawGimbal.rotation.y += dy * rotateSpeed;
			self.pitchGimbal.rotation.x += dx * rotateSpeed;
			self.pitchGimbal.rotation.x = Math.max( - PI_2, Math.min( PI_2, self.pitchGimbal.rotation.x ) );
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
		}

	};

})();
