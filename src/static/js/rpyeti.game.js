var RPYeti = RPYeti || {};

RPYeti.game = (function() {
	var self;

	return {

		/** Public Properties **/
		isFiring: false,
		lastFire: 0,

		/** Constructor **/

		init: function() {
			// save singleton context
			self = this;

			// game container
			this.container = $('#rpyeti').get( 0 );

			// create renderer and scene
			this.createRenderer();
			this.createScene();

			// create perspective camera
			var fov = ( RPYeti.config.stereo ) ? RPYeti.config.cardboard.fov : RPYeti.config.desktop.fov;
			this.camera = new THREE.PerspectiveCamera( fov, self.container.offsetWidth / self.container.offsetHeight, 0.1, 1000 );
			this.camera.position.set( 0, 10, 0 );
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

			//TODO: use or make key controls library instead of hardcoding
			$(document).on('keydown', function(e) {
				var prevent = true;
				// Update the state of the attached control to "false"
				switch (e.keyCode) {
					case 32: //SPACE
						self.isFiring = true;
					default:
						prevent = false;
				}
				// Avoid the browser to react unexpectedly
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

			// if device orientation event is triggered, set controls to orientation mode
			window.addEventListener('deviceorientation', this.setOrientationControls, true);

			this.clock = new THREE.Clock();

			// create environment
			this.addSnow();
			this.addSky();
			this.addLights();

			// add static models
			this.addTrees();

			// add game HUD
			this.addHUD();

			this.focalRaycaster = new THREE.Raycaster();

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

			if( self.isFiring ) {
				if( ( t - self.lastFire ) >= RPYeti.config.snowball.rate ) {
					self.addSnowball();
					self.lastFire = t;
				}
			}
			self.updateSnowballs( self.clock.getDelta() );

			self.render( self.clock.getDelta() );

			if( self.stats ) {
				self.stats.update();
			}
		},

		update: function(dt) {
			self.resize();
			self.camera.updateProjectionMatrix();
			self.controls.update(dt);
		},

		render: function(dt) {
			if( RPYeti.config.stereo ) {
				var points = self.getClosestFocalPoints(),
					diff = (Math.abs(points[0].x) + Math.abs(points[1].x)) / 2.0;

				self.hudPlaneL.position.x = diff
				self.hudPlaneR.position.x = -(diff)

				self.stereo.render( self.scene, self.camera, self.offset );
			} else {
				self.renderer.render( self.scene, self.camera );
			}
		},

		/** Event Handlers **/

		setOrientationControls: function(e) {
			if (!e.alpha) {
				return;
			}
			self.controls.dispose();
			self.controls = new THREE.DeviceOrientationControls(self.camera, true);
			self.controls.connect();
			self.controls.update();

			self.renderer.domElement.addEventListener('click', self.fullscreen, false);

			window.removeEventListener('deviceorientation', self.setOrientationControls, true);
		},

		resize: function() {
			var width = self.container.offsetWidth;
			var height = self.container.offsetHeight;

			self.camera.aspect = width / height;
			self.camera.updateProjectionMatrix();

			if( RPYeti.config.stereo ) {
				self.stereo.setSize( width, height );
				self.offset = (width - RPYeti.config.cardboard.pupillaryBaseline) / 2;
				if (self.offset < 0) { self.offset = 0 }
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
			} else if ( self.container.webkitRequestFullscreen ) {
				self.container.webkitRequestFullscreen();
			}
		},

		/** Engine **/

		createRenderer: function() {
			this.renderer = new THREE.WebGLRenderer({
				antialias: true,
			});
			this.renderer.shadowMap.enabled = true;
			this.renderer.setSize( window.innerWidth, window.innerHeight );
			$(this.container).append( this.renderer.domElement );

			if( RPYeti.config.stereo ) {
				this.stereo = new THREE.StereoEffect( this.renderer );
				this.stereo.focalLength = RPYeti.config.cardboard.focalLength;
				this.stereo.eyeSeparation = RPYeti.config.cardboard.eyeSeparation;
			} else if( RPYeti.config.fps ) {
				this.stats = new Stats();
				$(this.stats.domElement).css({ position: 'absolute', top: '0px' });
				$(this.container).append( this.stats.domElement );
			}
		},

		createScene: function() {
			this.scene = new THREE.Scene();

			if( RPYeti.config.stereo ) {
				this.scene.add( this.stereo.left );
				this.scene.add( this.stereo.right );
			}
		},

		/** Environment **/

		addSnow: function() {
			//TODO: move asynchronous texture loader to preloader
			var loader = new THREE.TextureLoader();
			loader.load('../textures/patterns/pixel-snow.jpg', function(texture) {
				texture.wrapS = THREE.RepeatWrapping;
				texture.wrapT = THREE.RepeatWrapping;
				texture.repeat = new THREE.Vector2(512, 512);
				texture.anisotropy = self.renderer.getMaxAnisotropy();

				var material = new THREE.MeshPhongMaterial({
					map: texture
				});

				var geometry = new THREE.PlaneGeometry(1000, 1000);

				var mesh = new THREE.Mesh(geometry, material);
				mesh.rotation.x = -Math.PI / 2;
				self.scene.add(mesh);
			});
		},

		addSky: function() {
			//TODO: move asynchronous texture loader to preloader
			var loader = new THREE.TextureLoader();
			loader.load('../textures/patterns/starfield.png', function(texture) {
				var geometry = new THREE.SphereGeometry(1000, 32, 32),
					material = new THREE.MeshBasicMaterial({
						map: texture,
						side: THREE.BackSide
					}),
					skybox = new THREE.Mesh(geometry, material);
				self.scene.add(skybox);
			});
		},

		addLights: function() {
			var ambient = new THREE.AmbientLight(0xffffff);
			self.scene.add( ambient );

			var light = new THREE.HemisphereLight(0xffffff, 0x000000, 0.4);
			self.scene.add( light );

			var directional = new THREE.DirectionalLight( 0xffeedd, 0.4 );
			directional.position.set(-200, 100, -100);
			directional.target.position.set(30, 0, 10);
			directional.castShadow = true;
			self.scene.add( directional );
		},

		/** Models **/

		addTrees: function() {
			//TODO: move asynchronous model loader to preloader
			var trees = RPYeti.config.trees,
				loader = new THREE.OBJMTLLoader();
			self.trees = new THREE.Group();
			self.scene.add( self.trees );
			loader.load('../models/voxel-tree.obj', '../textures/voxel-tree.mtl', function(object) {
				for (var i = 0; i < trees.length; i++) {
					var tree = object.clone();
					tree.translateX( trees[i][0] );
					tree.translateZ( trees[i][1] );
					tree.scale.set( 10, 10, 10 );
					self.trees.add( tree );
				}
			});
		},

		addHoles: function() {
			//TODO: add yeti holes, hidden if possible
		},

		/** Game interface (HUD) **/

		addHUD: function() {
			var width = 1024;
			var height = 1024;

			var hudCanvas = document.createElement('canvas');
			hudCanvas.width = width;
			hudCanvas.height = height;

			// save context
			self.hud = hudCanvas.getContext('2d');

			// draw text
			// self.hud.font = "Normal 20px Arial";
			// self.hud.textAlign = 'center';
			// self.hud.fillStyle = "rgba(245,245,245,0.85)";
			// self.hud.fillText( 'INSERT COIN', width / 2, height / 3 );

			// draw reticle
			self.hud.beginPath();
			self.hud.arc( width/2, height/2, 30, 0, 2 * Math.PI, false );
			self.hud.lineWidth = 10;
			self.hud.strokeStyle = 'rgb(0,174,239)';
			self.hud.stroke();

			var hudTexture = new THREE.Texture( hudCanvas );
			hudTexture.magFilter = THREE.NearestFilter;
			hudTexture.minFilter = THREE.NearestFilter;
			hudTexture.needsUpdate = true;

			var material = new THREE.MeshBasicMaterial({ map: hudTexture });
			material.transparent = true;

			var planeGeometry = new THREE.PlaneGeometry( 1, 1 );
			var plane = new THREE.Mesh( planeGeometry, material );

			plane.name = 'HUD';
			plane.position.set( 0, 0, -1 );

			if( RPYeti.config.stereo ) {
				var plane2 = plane.clone();

				this.stereo.left.add( plane );
				self.hudPlaneL = plane;

				this.stereo.right.add( plane2 );
				self.hudPlaneR = plane2;
			} else {
				self.camera.add( plane );
			}
		},

		getClosestFocalPoints: function() {
			self.focalRaycaster.setFromCamera( new THREE.Vector2(0, 0), self.camera );

			var intersects = self.focalRaycaster.intersectObjects( self.scene.children, true ),
				closest = null;

			if (intersects.length > 0) {
				for (var i in intersects) {
					if (intersects[i].object.name != 'HUD' && intersects[i].distance < self.stereo.focalLength) {
						closest = intersects[i];
						break
					}
				}
			}

			if (closest != null) {
				var p = closest.point,
					p2 = p.clone(),
					v = p.project(self.stereo.left),
					v2 = p2.project(self.stereo.right);

				return [ v, v2 ];
			} else {
				return [ new THREE.Vector3(), new THREE.Vector3() ];
			}
		},

		/** Projectiles **/

		addSnowball: function( source ) {
			var geometry = new THREE.SphereGeometry( RPYeti.config.snowball.size, RPYeti.config.snowball.lod, RPYeti.config.snowball.lod ),
				material = new THREE.MeshBasicMaterial({ color: 0xcccccc }),
				snowball = new THREE.Mesh( geometry, material );

			if( ! self.snowballs ) {
				self.snowballs = new THREE.Group();
				self.scene.add( self.snowballs );
			}
			if( ! source ) {
				source = new THREE.Vector3( 0, 10, 0 );
			}
			var raycaster = new THREE.Raycaster();
			raycaster.set( self.camera.getWorldPosition(), self.camera.getWorldDirection() );
			snowball.ray = raycaster.ray;
			snowball.ray.at( 1.0, snowball.position );
			self.snowballs.add( snowball );
			//debug
			//console.log( raycaster.intersectObjects( self.scene.children, true ) );
		},

		updateSnowballs: function( delta ) {
			if( self.snowballs ) {
				self.snowballs.traverseVisible(function(snowball) {
					if( snowball instanceof THREE.Mesh ) {
						var speed = RPYeti.config.snowball.speed * delta,
							dir = snowball.ray.direction;
						snowball.translateX( speed * dir.x );
						snowball.translateY( speed * dir.y );
						snowball.translateZ( speed * dir.z );
						if( snowball.ray.origin.distanceTo( snowball.position ) >= RPYeti.config.snowball.range ) {
							snowball.visible = false;
						}
					}
				});
			}
		},

	};

})();

$(function() {

	//TODO: wait for preloader finished event
	RPYeti.game.init();
	RPYeti.game.animate();

});
