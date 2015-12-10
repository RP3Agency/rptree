var RPYeti = RPYeti || {};

RPYeti.controls = (function() {
	var self;

	return {

		/** Public Properties **/
		isFiring: false,

		/** Constructor **/

		init: function(game) {
			self = this;

			this.game = game;
			this.element = this.game.renderer.domElement;
			this.camera = this.game.camera;

			this.initOrbit();
			this.initOrientation();
			this.initKeys();

			return this;
		},

		initOrbit: function() {
			this.controlType = 'ORBIT';
			this.controls = new THREE.OrbitControls( this.camera, this.element );
			this.controls.target.set(
				this.camera.position.x + 0.1,
				this.camera.position.y,
				this.camera.position.z
			);
			this.controls.enableZoom = false;
			this.controls.enablePan = false;
		},

		initKeys: function() {
			$(document).on('keydown', function(e) {
				var prevent = true;
				switch (e.keyCode) {
					case 32: //SPACE
						self.isFiring = true;
						break;
					default:
						prevent = false;
				}
				if (prevent) {
					e.preventDefault();
				}
			})
			.on('touchstart', function(e) {
				self.isFiring = true;
				e.preventDefault();
			})
			.on('touchmove', function(e) {
				e.preventDefault();
			})
			.on('keyup touchend', function(e) {
				self.isFiring = false;
				e.preventDefault();
			});

		},

		initOrientation: function() {
			// if device orientation event is triggered, set controls to orientation mode
			window.addEventListener('deviceorientation', self.setOrientationControls, true);
		},

		setOrientationControls: function(e) {
			if (!e.alpha) {
				return;
			}
			this.controlType = 'ORIENTATION';
			window.removeEventListener('deviceorientation', self.setOrientationControls, true);

			self.controls.dispose();
			self.controls = new THREE.DeviceOrientationControls( self.camera, true );
			self.controls.connect();
			self.controls.update();

			self.element.addEventListener('click', self.game.fullscreen, false);

		},

		update: function(delta) {
			self.controls.update( delta );
		},

	};

})();
