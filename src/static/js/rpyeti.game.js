var RPYeti = RPYeti || {};

RPYeti.game = (function() {
	var self;

	return {

		/** Public Properties **/
		isFiring: false,
		lastFire: 0,
		health: 100,

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

			// create audio listener
			this.listener = new THREE.AudioListener();
			this.camera.add( this.listener );

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
			this.addRocks();
			this.addMounds();
			this.addSnowball();

			// add game HUD
			this.addHUD();

			// add sound effects
			this.addSounds();

			// add tweening and focal adjustment for HUD
			//TODO: move to function and do conditional on config.stereo flag
			this.focalRaycaster = new THREE.Raycaster();
			this.focalPoint = new THREE.Vector2(0, 0);
			this.focalTween = new TWEEN.Tween({ x: 0, y: 0 })
				.easing(RPYeti.config.hud.easing)
				.onUpdate(function () {
					self.hudPlaneL.position.x = this.x;
					self.hudPlaneR.position.x = -(this.x);
				});
			this.focalTween.end = 0;

			if( RPYeti.config.wireframe ) {
				setTimeout(function() {
					self.scene.traverse(function(child) {
						if ( child instanceof THREE.Mesh ) {
							child.material.wireframe = true;
						}
					});
				}, 200);
			}


			/** SAMPLE HEALTH METER **/
			/*
			function upd() {
				self.health--;
				if (self.health < 0) {
					self.health = 100;
				}

				self.updateReticle(self.health);
				setTimeout(upd, 100);
			}
			upd();
			*/
			/** END SAMPLE HEALTH METER **/

			/** SAMPLE YETI SPAWNER **/
			self.yetis = new THREE.Group();
			self.characters = { yetis: [] };
			self.scene.add( self.yetis );
			function upd() {
				if (self.characters.yetis.length < 20) {
					var yeti = new RPYeti.character.yeti(self.yetis),
						x = Math.random() * (RPYeti.config.character.maxX - RPYeti.config.character.minX + 1) + RPYeti.config.character.minX ,
						z = Math.random() * (RPYeti.config.character.maxZ - RPYeti.config.character.minZ + 1) + RPYeti.config.character.minZ;

					yeti.position(x, z, 4, self.camera.getWorldPosition());

					yeti.setAction(function (context) {
						var pos = context.pivot.position.clone();
						pos.y = 15;

						self.throwSnowball(pos);
					});

					yeti.on('appear', function (context) {
						context.fireCount = 0;
						setTimeout(function () {
							context.action();
						}, 500);
					});

					yeti.on('action', function (context) {
						setTimeout(function () {
							if (context.fireCount < 2) {
								context.action();
							} else {
								context.disappear();
							}
							context.fireCount++;
						}, 3000);
					});

					yeti.on('defeat', function (context) {
						setTimeout(function () {
							context.remove();
						}, 500);
					});

					self.characters.yetis.push(yeti);
				}

				for (var i in self.characters.yetis) {
					self.characters.yetis[i].appear();
				}

				setTimeout(upd, 20000);
			}
			upd();
			/** END SAMPLE YETI SPAWNER **/

			// set resize event
			$(window).on('resize', this.resize);
			setTimeout(this.resize, 1);
		},

		/** Methods / Callbacks **/

		animate: function(t) {
			var delta = self.clock.getDelta();

			window.requestAnimationFrame( self.animate );
			self.update( delta );

			if( self.isFiring ) {
				if( ( t - self.lastFire ) >= RPYeti.config.snowball.rate ) {
					self.playSound( self.sounds.throw );
					self.throwSnowball();
					self.lastFire = t;
				}
			}
			self.updateSnowballs( delta );

			if( self.stats ) {
				self.stats.update();
			}

			self.render( delta );
		},

		update: function(dt) {
			self.camera.updateProjectionMatrix();
			self.controls.update(dt);

			TWEEN.update();
		},

		render: function(dt) {
			if( RPYeti.config.stereo ) {
				self.updateReticleFocus();
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
				alpha: true
			});
			this.renderer.shadowMap.enabled = true;
			this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
			var texture = RPYeti.loader.textures.snow;
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;
			texture.repeat = new THREE.Vector2(256, 256);
			texture.anisotropy = self.renderer.getMaxAnisotropy();

			var material = new THREE.MeshPhongMaterial({
				map: texture,
			});

			var geometry = new THREE.PlaneGeometry(2000, 2000);

			var mesh = new THREE.Mesh( geometry, material );
			mesh.rotation.x = -Math.PI / 2;
			mesh.receiveShadow = true;
			self.snow = mesh;
			self.scene.add( mesh );
		},

		addSky: function() {
			var geometry = new THREE.SphereGeometry(1000, 32, 32),
				material = new THREE.MeshBasicMaterial({
					map: RPYeti.loader.textures.stars,
					side: THREE.BackSide
				}),
				skybox = new THREE.Mesh(geometry, material);
			self.scene.add( skybox );
		},

		addLights: function() {
			var ambient = new THREE.AmbientLight(0x888888);
			self.scene.add( ambient );

			var light = new THREE.HemisphereLight(0xffffff, 0x000000, 0.3);
			self.scene.add( light );

			var directional = new THREE.DirectionalLight( 0xddeeff, 0.6 );
			directional.position.x	= -600;
			directional.position.y	= 400;
			directional.position.z	= 20;
			directional.castShadow = true;
			directional.shadowMapWidth = 512;
			directional.shadowMapHeight = 512;
			directional.shadowCameraNear = 200;
			directional.shadowCameraFar = 1000;
			directional.shadowCameraFov = 90;
			self.scene.add( directional );

		},

		/** Models **/

		addTrees: function() {
			var model = RPYeti.loader.models.tree,
				trees = RPYeti.config.trees;
			self.trees = new THREE.Group();
			self.scene.add( self.trees );
			for (var i = 0; i < trees.length; i++) {
				var tree = model.clone();
				tree.translateX( trees[i][0] );
				tree.translateZ( trees[i][1] );
				tree.scale.set( 4, 4, 4 );
				self.trees.add( tree );
			}
		},

		addRocks: function() {
			var rocks = RPYeti.config.rocks;
			self.rocks = new THREE.Group();
			self.scene.add( self.rocks );
			for (var i = 0; i < rocks.length; i++) {
				var rock = RPYeti.loader.models[ rocks[i][0] ].clone();
				rock.translateX( rocks[i][1] );
				rock.translateZ( rocks[i][2] );
				rock.scale.set( 4, 4, 4 );
				self.rocks.add( rock );
			}
		},

		addMounds: function() {
			var model = RPYeti.loader.models.mound,
				mounds = RPYeti.config.mounds;

			self.mounds = new THREE.Group();
			self.scene.add( self.mounds );
			for (var i = 0; i < mounds.length; i++) {
				var mound = model.clone();
				mound.translateX( mounds[i][0] );
				mound.translateZ( mounds[i][1] );
				mound.scale.set( 8, 8, 8 );
				self.mounds.add( mound );
			}
		},

		/** Sounds **/

		addSounds: function() {
			self.sounds = {};

			// snowball throw sound
			self.sounds.throw = new THREE.Audio( self.listener );
			self.sounds.throw.setBuffer( RPYeti.loader.sounds.throw );
			self.sounds.throw.setVolume( 0.2 );
			self.listener.add( self.sounds.throw );

		},

		playSound: function( sound ) {
			if( sound.isPlaying ) {
				sound.stop();
				sound.isPlaying = false;
			}
			sound.play();
		},

		/** Game interface (HUD) **/

		addHUD: function() {
			var hudCanvas = document.createElement('canvas');
			hudCanvas.width = RPYeti.config.hud.canvasWidth;
			hudCanvas.height = RPYeti.config.hud.canvasHeight;

			// save context
			self.hud = hudCanvas.getContext('2d');
			self.hudTexture = new THREE.Texture( hudCanvas );

			// draw reticle
			self.updateReticle(self.health);

			var material = new THREE.MeshBasicMaterial({ map: self.hudTexture });
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

		updateReticle: function (healthPercent) {
			var width = RPYeti.config.hud.canvasWidth,
				height = RPYeti.config.hud.canvasHeight,
				arcInitial = (1 * Math.PI),
				arcFull = (2 * Math.PI);

			if (healthPercent > 100) {
				healthPercent = 100;
			} else if (healthPercent < 0) {
				healthPercent = 0;
			}

			healthPercent = (100 - healthPercent) / 100 * arcFull + arcInitial;

			self.hud.clearRect(0, 0, width, height);

			self.hud.beginPath();
			self.hud.arc( width/2, height/2, RPYeti.config.hud.size, 0, arcFull, false );
			self.hud.lineWidth = 10;
			self.hud.strokeStyle = RPYeti.config.hud.baseColor;
			self.hud.stroke();

			self.hud.beginPath();
			self.hud.arc( width/2, height/2, RPYeti.config.hud.size, arcInitial, healthPercent, false );
			self.hud.lineWidth = 10;
			self.hud.strokeStyle = RPYeti.config.hud.damageColor;
			self.hud.stroke();

			self.hudTexture.needsUpdate = true;
		},

		updateReticleFocus: function () {
			var points = self.getClosestFocalPoints(),
				diff = (Math.abs(points[0].x) + Math.abs(points[1].x)) / 2.0;

			if (diff > RPYeti.config.hud.innerFocalMax) {
				diff = RPYeti.config.hud.innerFocalMax;
			}

			if (self.focalTween.end != diff) {
				self.focalTween.stop();
				self.focalTween.end = diff;
				self.focalTween.to({ x: diff, y: 0 }, RPYeti.config.hud.easeDuration).start();
			}
		},

		getClosestFocalPoints: function() {
			self.focalRaycaster.setFromCamera( self.focalPoint, self.camera );

			var intersects = self.focalRaycaster.intersectObjects( self.scene.children, true ),
				closest = null;

			for (var i in intersects) {
				if (intersects[i].object.name != 'HUD' && intersects[i].distance < self.stereo.focalLength) {
					closest = intersects[i];
					break;
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
			self.snowballs = new THREE.Group();
			self.scene.add( self.snowballs );
			var geometry = new THREE.SphereGeometry( RPYeti.config.snowball.size, RPYeti.config.snowball.lod, RPYeti.config.snowball.lod ),
				material = new THREE.MeshPhongMaterial({ map: RPYeti.loader.textures.snowball });
			self.snowball = new THREE.Mesh( geometry, material );
			self.snowball.castShadow = true;
			self.snowball.receiveShadow = true;
		},

		throwSnowball: function( source ) {
			if( ! self.snowball ) return;

			var raycaster = new THREE.Raycaster();
			if( source ) {
				raycaster.set( source, self.camera.getWorldPosition().sub(source).normalize() );
			} else {
				raycaster.set( self.camera.getWorldPosition(), self.camera.getWorldDirection() );
			}

			var snowball = self.snowball.clone();
			snowball.ray = raycaster.ray;
			snowball.ray.at( 5.0, snowball.position );
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
							self.removeSnowball( snowball );
						}
						var raycaster = new THREE.Raycaster( snowball.position, dir );
						var collisions = raycaster.intersectObjects( [ self.snow, self.snowballs, self.trees, self.rocks, self.mounds, self.yetis ], true );
						for( var i = 0; i < collisions.length; i++ ) {
							if( collisions[i].object != snowball && collisions[i].distance <= ( RPYeti.config.snowball.size * 4 ) ) {
								self.removeSnowball( snowball, collisions[i].object );
							}
						}
					}
				});
			}
		},

		removeSnowball: function( snowball, target ) {
			// hide snowball
			snowball.visible = false;
			//TODO: make particle explosion at impact

			// play impact sound depending on object struck
			if( target ) {
				var effect;
				if ( target == self.snow ) {
					effect = RPYeti.loader.sounds.tink;
				} else if( self.yetis.getObjectById( target.id ) ) {
					effect = RPYeti.loader.sounds.oof;
					//target.trigger('impact');   <-- TODO: make yeti do something when hit
				} else if( self.snowballs.getObjectById( target.id ) ) {
					self.removeSnowball( target );
					effect = RPYeti.loader.sounds.splat;
				} else if( self.trees.getObjectById( target.id ) ) {
					effect = RPYeti.loader.sounds.thump;
				} else if ( self.rocks.getObjectById( target.id ) ) {
					effect = RPYeti.loader.sounds.whack;
				} else if( self.mounds.getObjectById( target.id ) ) {
					effect = RPYeti.loader.sounds.tink;
				}
				if( effect ) {
					var impact = new THREE.PositionalAudio( self.listener );
					impact.setBuffer( effect );
					snowball.add( impact );
					impact.play();
				}
			}

			// get rid of snowball after delay
			setTimeout( function() {
				self.snowballs.remove( snowball );
			}, 500 );
		},

	};

})();

$(function() {

	$(document).on('rpyeti.loader.complete', function(){
		if( RPYeti.config.stereo ) {
			//TODO: display touch to start message
			var init;
			$(document).on('mouseup touchend', function(e) {
				if( ! init ) {
					init = true;
					RPYeti.game.init();
					RPYeti.game.animate();
				}
			});
		} else {
			RPYeti.game.init();
			RPYeti.game.animate();
		}
	});

});
