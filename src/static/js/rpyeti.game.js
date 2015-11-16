var RPYeti = RPYeti || {};

RPYeti.game = (function() {
	var self;

	return {

		/** Constructor **/

		init: function() {
			// save singleton context
			self = this;

			// game container
			this.container = $('#rpyeti').get( 0 );

			// create renderer and scene
			this.createRenderer();
			this.scene = new THREE.Scene();

			// create perspective camera
			var fov = ( RPYeti.config.stereo ) ? RPYeti.config.cardboard.fov : RPYeti.config.desktop.fov;
			this.camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 0.1, 200 );
			this.camera.position.set( 0, 1, 0 );
			this.scene.add( this.camera );

			// create user controls
			this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
			this.controls.target.set(
				this.camera.position.x + 0.1,
				this.camera.position.y,
				this.camera.position.z
			);
			this.controls.enableZoom = false;
			this.controls.enablePan = false;

			// if device orientation event is triggered, set controls to orientation mode
			$(window).on('deviceorientation', this.setOrientationControls);

			this.clock = new THREE.Clock();

			// create environment
			this.addSnow();
			this.addSky();
			this.addLights();

			// add static models
			this.addTrees();

			// add game HUD
			this.addHUD();

			if( RPYeti.config.wireframe ) {
				setTimeout(function() {
					self.scene.traverse(function(child) {
						if ( child instanceof THREE.Mesh ) {
							child.material.wireframe = true;
						}
					});
				}, 200);
			}

			// set resize event
			$(window).on('resize', this.resize);
			setTimeout(this.resize, 1);
		},

		/** Methods / Callbacks **/

		animate: function(t) {
			window.requestAnimationFrame( self.animate );
			self.update( self.clock.getDelta() );
			self.render( self.clock.getDelta() );
		},

		update: function(dt) {
			self.resize();
			self.camera.updateProjectionMatrix();
			self.controls.update(dt);
		},

		render: function(dt) {
			if( RPYeti.config.stereo ) {
				self.stereo.render( self.scene, self.camera );
			} else {
				self.renderer.render( self.scene, self.camera );
			}
		},

		/** Event Handlers **/

		setOrientationControls: function(e) {
			if (!e.alpha) {
				return;
			}
			self.controls = new THREE.DeviceOrientationControls(self.camera, true);
			self.controls.connect();
			self.controls.update();

			$(self.renderer.domElement).on('click', fullscreen);

			$(window).off('deviceorientation', self.setOrientationControls);
		},

		resize: function() {
			var width = self.container.offsetWidth;
			var height = self.container.offsetHeight;

			self.camera.aspect = width / height;
			self.camera.updateProjectionMatrix();

			if( RPYeti.config.stereo ) {
				self.stereo.setSize( width, height );
			} else {
				self.renderer.setSize( width, height );
			}
		},

		fullscreen: function() {
			if ( self.container.requestFullscreen ) {
				self.container.requestFullscreen();
			} else if ( self.container.msRequestFullscreen ) {
				self.container.msRequestFullscreen();
			} else if ( self.container.mozRequestFullScreen ) {
				self.container.mozRequestFullScreen();
			} else if ( container.webkitRequestFullscreen ) {
				self.container.webkitRequestFullscreen();
			}
		},

		/** Engine **/

		createRenderer: function() {
			this.renderer = new THREE.WebGLRenderer({
				antialias: true,
			});
			this.renderer.setSize( window.innerWidth, window.innerHeight );
			$(this.container).append( this.renderer.domElement );

			if( RPYeti.config.stereo ) {
				this.stereo = new THREE.StereoEffect( this.renderer );
				this.eyeSeparation = RPYeti.config.cardboard.eyeSeparation;
				this.focalLength = RPYeti.config.cardboard.focalLength;
			}

		},

		/** Environment **/

		addSnow: function() {
			//TODO: move asynchronous texture loader to preloader
			var loader = new THREE.TextureLoader();
			loader.load('../textures/patterns/pixel-snow.jpg', function(texture) {
				texture.wrapS = THREE.RepeatWrapping;
				texture.wrapT = THREE.RepeatWrapping;
				texture.repeat = new THREE.Vector2(1024, 1024);
				texture.anisotropy = self.renderer.getMaxAnisotropy();

				var material = new THREE.MeshPhongMaterial({
					map: texture
				});

				var geometry = new THREE.PlaneGeometry(200, 200);

				var mesh = new THREE.Mesh(geometry, material);
				mesh.rotation.x = -Math.PI / 2;
				self.scene.add(mesh);
			});
		},

		addSky: function() {
			//TODO: move asynchronous texture loader to preloader
			var loader = new THREE.TextureLoader();
			loader.load('../textures/patterns/starfield.png', function(texture) {
				var geometry = new THREE.SphereGeometry(200, 32, 32),
					material = new THREE.MeshBasicMaterial({
						map: texture,
						side: THREE.BackSide
					}),
					skybox = new THREE.Mesh(geometry, material);
				self.scene.add(skybox);
			});
		},

		addLights: function() {
			var light = new THREE.HemisphereLight(0xffffff, 0x000000, 0.8);
			self.scene.add( light );

			var directional = new THREE.DirectionalLight( 0xffeedd, 0.4 );
			directional.position.set(-200, 100, -100);
			directional.target.position.set(30, 0, 10);
			self.scene.add( directional );
		},

		/** Models **/

		addTrees: function() {
			//TODO: move asynchronous model loader to preloader
			var trees = RPYeti.config.trees,
				loader = new THREE.OBJMTLLoader();
			loader.load('../models/voxel-tree.obj', '../textures/voxel-tree.mtl', function(object) {
				for (var i = 0; i < trees.length; i++) {
					var tree = object.clone();
					tree.translateX(trees[i][0]);
					tree.translateZ(trees[i][1]);
					self.scene.add(tree);
				}
			});
		},

		addHoles: function() {
			//TODO: add yeti holes, hidden if possible
		},

		/** Game interface (HUD) **/

		addHUD: function() {
			//TODO: fix canvas size warning, figure out correct size and scale of HUD
			var width = self.container.offsetWidth;
			var height = self.container.offsetHeight;

			var hudCanvas = document.createElement('canvas');
			hudCanvas.width = width;
			hudCanvas.height = height;

			self.hud = hudCanvas.getContext('2d');
			self.hud.font = "Normal 16px Arial";
			self.hud.textAlign = 'center';
			self.hud.fillStyle = "rgba(245,245,245,0.85)";
			self.hud.fillText( 'INSERT COIN', width / 2, height / 3 );

			// self.hud.beginPath();
			// self.hud.lineWidth = '200';
			// self.hud.strokeStyle = 'rgba(255,255,255,1.0)';
			// self.hud.rect(0, 0 , width, height);
			// self.hud.stroke();

			var hudTexture = new THREE.Texture( hudCanvas );
			hudTexture.magFilter = THREE.NearestFilter;
			hudTexture.minFilter = THREE.NearestFilter;
			hudTexture.needsUpdate = true;

			var material = new THREE.MeshBasicMaterial({ map: hudTexture });
			material.transparent = true;

			var planeGeometry = new THREE.PlaneGeometry( self.container.offsetWidth / 1000, self.container.offsetHeight / 1000 );
			var plane = new THREE.Mesh( planeGeometry, material );
			plane.position.set( 0, 0, -0.2 );
			plane.scale.set( 0.18, 0.18, 0.18 )

			self.camera.add( plane );
		},

	};

})();

$(function() {

	//TODO: wait for preloader finished event
	RPYeti.game.init();
	RPYeti.game.animate();

});
