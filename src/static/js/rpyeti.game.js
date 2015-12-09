var RPYeti = RPYeti || {};

RPYeti.game = (function() {
	var self;

	return {

		/** Public Properties **/
		isFiring: false,
		lastFire: 0,
		level: 0,
		snowballBlockers: [],

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
			this.camera = new THREE.PerspectiveCamera( fov, self.container.offsetWidth / self.container.offsetHeight, 0.1, RPYeti.config.terrain.depth );
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

			this.player = new RPYeti.Player();
			this.gameplay = new RPYeti.Gameplay(this, this.player, this.camera, this.scene);

			//TODO: use or make key controls library instead of hardcoding
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
			this.addLogs();
			this.addSigns();
			this.addSnowball();

			self.snowballBlockers = [ self.snow, self.snowballs, self.trees, self.rocks, self.mounds, self.logs, self.signs, self.gameplay.yetis ];

			// add game HUD
			if (RPYeti.config.stereo) {
				this.hud = new RPYeti.HUD(this.player, this.camera, this.stereo);
			} else {
				this.hud = new RPYeti.HUD(this.player, this.camera);
			}

			// add sound effects
			this.addSounds();

			// do debug setup
			this.debug();

			// set resize event
			$(window).on('resize', this.resize);
			setTimeout(this.resize, 1);

			var startLevel = 0;
			if (startLevel > 0) {
				self.player.setTimeout(function () {
					self.gameplay.start(startLevel, true);
				}, 1000);
			} else {
				self.gameplay.start(startLevel, true);
			}
		},

		/** Methods / Callbacks **/

		animate: function(t) {
			var delta = self.clock.getDelta();

			window.requestAnimationFrame( self.animate );
			self.update( delta );

			if( self.isFiring && self.player.health > 0 ) {
				if( ( t - self.lastFire ) >= RPYeti.config.snowball.rate ) {
					self.playSound( self.sounds.throw );
					self.throwSnowball(undefined, self.player);
					self.lastFire = t;
				}
			}
			self.updateSnowballs( delta );
			$(self.container).trigger('rpyeti.game.update', delta);

			self.render( delta );
		},

		update: function(dt) {
			self.controls.update(dt);
			RPYeti.Character.update(dt);
			TWEEN.update();
		},

		render: function(dt) {
			if( RPYeti.config.stereo ) {
				self.hud.updateReticleFocus(self.scene);
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

			window.removeEventListener('deviceorientation', self.setOrientationControls, true);

			self.controls.dispose();
			self.controls = new THREE.DeviceOrientationControls(self.camera, true);
			self.controls.connect();
			self.controls.update();

			self.renderer.domElement.addEventListener('click', self.fullscreen, false);
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

			var size = RPYeti.config.terrain.depth * 2,
				geometry = new THREE.PlaneGeometry(size, size);

			var mesh = new THREE.Mesh( geometry, material );
			mesh.rotation.x = -Math.PI / 2;
			mesh.receiveShadow = true;
			self.snow = mesh;
			self.scene.add( mesh );
		},

		addSky: function() {
			var geometry = new THREE.SphereGeometry(RPYeti.config.terrain.depth, 64, 64),
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

			var light = new THREE.HemisphereLight(0xddddff, 0x333355, 0.3);
			self.scene.add( light );

			var directional = new THREE.DirectionalLight( 0xaaddff, 0.6 );
			directional.position.x	= -600;
			directional.position.y	= 600;
			directional.position.z	= -400;
			directional.castShadow = true;
			directional.shadowMapWidth = 512;
			directional.shadowMapHeight = 512;
			directional.target = this.camera;
			//directional.shadowCameraNear = 50;
			//directional.shadowCameraFar = 500;
			//directional.shadowCameraFov = 90;
			self.scene.add( directional );

		},

		/** Models **/

		addObjects: function(arr, baseModel, density, group, rotation, scale) {
			rotation = rotation || false;
			scale = scale || 4;

			for (var i = 0; i < arr.length; i++) {
				var model = baseModel.clone(),
					x = arr[i][0] * density,
					z = arr[i][1] * density;
					distance = Math.sqrt(Math.pow(x, 2) + Math.pow(z, 2));

				if (distance < self.camera.far) {
					model.translateX( x );
					model.translateZ( z );
					model.scale.set( scale, scale, scale );

					if (rotation) {
						model.rotateY(Math.random() * Math.PI * 2);
					}

					group.add( model );
				}
			}
		},

		addTrees: function() {
			var trees = RPYeti.loader.maps.main.trees,
				strees = RPYeti.loader.maps.main.strees
				density = RPYeti.loader.maps.main.density;
			self.trees = new THREE.Group();
			self.scene.add( self.trees );

			self.addObjects(trees, RPYeti.loader.models[ 'tree' ], density, self.trees, true);
			self.addObjects(strees, RPYeti.loader.models[ 'snowytree' ], density, self.trees, true);
		},

		addRocks: function() {
			var rocks =  RPYeti.loader.maps.main.rocks,
				srocks = RPYeti.loader.maps.main.srocks,
				density = RPYeti.loader.maps.main.density;

			self.rocks = new THREE.Group();
			self.scene.add( self.rocks );

			self.addObjects(rocks, RPYeti.loader.models[ 'rock' ], density, self.rocks, true);
			self.addObjects(srocks, RPYeti.loader.models[ 'snowyrock' ], density, self.rocks, true);
		},

		addMounds: function() {
			var model = RPYeti.loader.models.mound,
				mounds = RPYeti.loader.maps.main.mounds,
				density = RPYeti.loader.maps.main.density;

			// texture tiling tweak
			model.children[0].children[1].material.map.repeat.set(3, 3);

			self.mounds = new THREE.Group();
			self.scene.add( self.mounds );

			self.addObjects(mounds, model, density, self.mounds, false, 8);
		},

		addLogs: function () {
			var model = RPYeti.loader.models.log,
				logs = RPYeti.loader.maps.main.logs,
				density = RPYeti.loader.maps.main.density;

			self.logs = new THREE.Group();
			self.scene.add( self.logs );

			self.addObjects(logs, model, density, self.logs, true, 6);
		},

		addSigns: function () {
			var model = RPYeti.loader.models.sign,
				signs = RPYeti.loader.maps.main.signs,
				density = RPYeti.loader.maps.main.density,
				cameraPos = self.camera.getWorldPosition();

			self.signs = new THREE.Group();
			self.scene.add( self.signs );

			if (self.signs.children.length > 0) {
				self.addObjects(signs, model, density, self.signs, false);

				cameraPos.y = self.signs.children[0].position.y;
				for (var i in self.signs.children) {
					self.signs.children[i].lookAt(cameraPos);
				};
			}
		},

		/** Sounds **/

		addSounds: function() {
			self.sounds = {};

			// snowball throw sound
			self.sounds.throw = new THREE.Audio( self.listener );
			self.sounds.throw.setBuffer( RPYeti.loader.sounds.player_throw );
			self.sounds.throw.setVolume( RPYeti.config.audio.pointblankVolume );
			self.listener.add( self.sounds.throw );

		},

		playSound: function( sound ) {
			if( sound.isPlaying ) {
				sound.stop();
				sound.isPlaying = false;
			}
			sound.play();
		},

		createSoundEffect: function( sound ) {
			var effect = new THREE.PositionalAudio( self.listener );
			effect.setBuffer( sound );
			effect.setVolume( RPYeti.config.audio.effectVolume );
			effect.setRolloffFactor( RPYeti.config.audio.effectRolloff );
			effect.setMaxDistance( RPYeti.config.snowball.range );
			return effect;
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
			self.snowball.name = 'snowball';
		},

		throwSnowball: function( source, character ) {
			if( ! self.snowball ) return;

			var raycaster = new THREE.Raycaster();
			if( source ) {
				raycaster.set( source, self.camera.getWorldPosition().sub(source).normalize() );
			} else {
				raycaster.set( self.camera.getWorldPosition(), self.camera.getWorldDirection() );
			}

			var snowball = self.snowball.clone();
			snowball.userData.initiator = character;
			snowball.userData.damage = RPYeti.config.snowball.damage;
			snowball.ray = raycaster.ray;
			snowball.ray.at( 5.0, snowball.position );
			self.snowballs.add( snowball );
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
						if( snowball.userData.initiator != self.player && snowball.position.distanceTo( self.camera.getWorldPosition() ) <= RPYeti.config.player.hitbox ) {
							self.removeSnowball( snowball, self.player );
						}
						var raycaster = new THREE.Raycaster( snowball.position, dir );
						var collisions = raycaster.intersectObjects( self.snowballBlockers, true );
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
			// avoid duplicate hits
			if (snowball.visible) {
				self.explodeSnowball( snowball );
				// hide snowball
				snowball.visible = false;

				// play impact sound depending on object struck
				if( target ) {
					var effect;
					if ( target instanceof RPYeti.Player ) {
						effect = RPYeti.loader.sounds.player_hit;
					} else if ( target == self.snow ) {
						effect = RPYeti.loader.sounds.snow_hit;
					} else if( self.gameplay.yetis.getObjectById( target.id ) ) {
						effect = RPYeti.loader.sounds.yeti_hit;
					} else if( self.snowballs.getObjectById( target.id ) ) {
						self.removeSnowball( target );
						effect = RPYeti.loader.sounds.snow_hit;
					} else if( self.trees.getObjectById( target.id ) ) {
						effect = RPYeti.loader.sounds.tree_hit;
					} else if ( self.rocks.getObjectById( target.id ) || self.logs.getObjectById( target.id ) ) {
						effect = RPYeti.loader.sounds.rock_hit;
					} else if( self.mounds.getObjectById( target.id ) ) {
						effect = RPYeti.loader.sounds.snow_hit;
					} else if( self.gameplay.intro && self.gameplay.intro.getObjectById( target.id ) ) {
						setTimeout(function () {
							var t = target;
							while (t.type != 'Object3D' && t.parent != null) {
								t = t.parent;
							}
							self.player.trigger('intro.select', t.name);
						}, 100);
					}

					if( effect ) {
						var impact = self.createSoundEffect( effect );
						snowball.add( impact );
						impact.play();
					}

					if (target instanceof RPYeti.Character) {
						target.hit(snowball);
					} else if (target.userData && target.userData.character) {
						target.userData.character.hit(snowball);
					}
				}

				// get rid of snowball after delay
				setTimeout( function() {
					self.snowballs.remove( snowball );
				}, 500 );
			}
		},

		explodeSnowball: function( snowball ) {
			var explosion = self.snowball.clone();
			explosion.position.copy( snowball.position );
			explosion.material = new THREE.MeshPhongMaterial({ map: RPYeti.loader.textures.snowburst });
			explosion.material.transparent = true;
			explosion.castShadow = false;
			explosion.receiveShadow = false;
			explosion.name = 'explosion';
			self.scene.add( explosion );
			var explosionTween = new TWEEN.Tween({ scale: explosion.scale.x, opacity: explosion.material.opacity })
				.easing( TWEEN.Easing.Quadratic.Out )
				.onUpdate(function () {
					explosion.scale.set( this.scale, this.scale, this.scale );
					explosion.material.opacity = this.opacity;
				}).onComplete(function () {
					self.scene.remove( explosion );
				});
			explosionTween.to({ scale: 4, opacity: 0 }, 300 ).start();
		},

		debug: function() {
			if( RPYeti.config.wireframe ) {
				setTimeout(function() {
					self.scene.traverse(function(child) {
						if ( child instanceof THREE.Mesh ) {
							child.material.wireframe = true;
						}
					});
				}, 200);
			}
			if( RPYeti.config.fps ) {
				this.stats = new Stats();
				$(this.stats.domElement).css({ position: 'absolute', top: '0px' });
				$(this.container).append( this.stats.domElement );
				$(this.container).on('rpyeti.game.update', function() {
					self.stats.update();
				});
			}
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
