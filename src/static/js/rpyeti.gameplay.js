var RPYeti = RPYeti || {};

RPYeti.Gameplay = function (game) {
	this.game = game;
	this.level = 0;

	this.characters = { yetis: { count: 0, objs: {} } };

	this.yetis = new THREE.Group();
	this.game.scene.add( this.yetis );

	(function (self) {
		self.game.player.on('defeated', function (context) {
			self.game.hud.addText('GAME OVER', 0);
		});

		self.game.player.on('hit', function (context) {
			self.game.hud.updateReticle();
		});

		self.game.player.on('yeti.defeat', function (context, yeti) {
			context.points += yeti.points;
		});
	})(this);
};

RPYeti.Gameplay.prototype.constructor = RPYeti.Gameplay;

RPYeti.Gameplay.prototype.start = function (level, reset) {
	this.level = level;

	if (reset) {
		this.game.player.points = 0;
	}

	if (level == 0) {
		this.startIntro();
	} else {
		this.levelBegin(level);
	}
};

RPYeti.Gameplay.prototype.levelBegin = function (level) {
	this.game.hud.addText('Level ' + level);

	this.sampleYetiSpawner();
};

RPYeti.Gameplay.prototype.startIntro = function () {
	var introPoints = RPYeti.loader.maps.main.intro,
		treeModel = RPYeti.loader.models.tree,
		signModel = RPYeti.loader.models.sign,
		scale = 4,
		density = RPYeti.loader.maps.main.density,
		cameraPos = this.game.camera.getWorldPosition();

		if (this.intro !== undefined) {
			this.game.scene.remove(this.intro);
			while (this.intro.children.length) { this.intro.children.pop(); }
		}

		this.intro = new THREE.Group();
		cameraPos.y = signModel.position.y;

		for (var i = 0; i < introPoints.length; i++) {
			var tree = treeModel.clone(),
				sign = signModel.clone(),
				x = introPoints[i][0],
				z = introPoints[i][1];

			tree.userData = { introObj: 'tree', introNumber: i };
			tree.translateX( x * density + 10);
			tree.translateZ( z * density );
			tree.scale.set( scale, scale, scale );

			this.intro.add( tree );

			sign.userData = { introObj: 'sign', introNumber: i };
			sign.translateX( x * density );
			sign.translateZ( z * density );
			sign.scale.set( scale, scale, scale );

			sign.lookAt(cameraPos);

			this.intro.add( sign );
		}

		this.game.scene.add(this.intro);
		this.game.snowballBlockers.push(this.intro);

		(function (self) {
			self.game.player.on('intro.select', function (context, number) {
				context.selected = number;

				// TODO: Something with selection

				self.endIntro(number);
			});
		})(this);
};

RPYeti.Gameplay.prototype.endIntro = function (number) {
	var yeti = null;

	this.game.player.on('intro.select', function () {});

	for (var i in this.intro.children) {
		if (this.intro.children[i].userData && this.intro.children[i].userData.introObj == 'tree') {
			var position = this.intro.children[i].position.clone();
			position.x += 10;
			position.z -= 5;

			yeti = this.spawnYeti(this.intro, position, 1.35);
			yeti.appear();
		}
	}

	// Attach to last yeti instance only
	(function (self) {
		yeti.on('appear', function (context) {
			context.roar = new THREE.PositionalAudio( self.game.listener );
			context.roar.setBuffer( RPYeti.loader.sounds.roar );
			context.pivot.add( context.roar );

			var bounds = new THREE.Box3().setFromObject(self.intro);
			context.setTimeout(function () {
				var positionTween = new TWEEN.Tween(self.intro.position)
					.easing(RPYeti.config.character.yeti.disappearEasing)
					.onComplete(function () {
						// Cleanup
						if (self.intro !== undefined) {
							self.game.scene.remove(self.intro);
							while (self.intro.children.length) { self.intro.children.pop(); }
							for (var i = self.game.snowballBlockers.length + 1; i > 0; i--) {
								if (self.game.snowballBlockers[i] == self.intro) {
									self.game.snowballBlockers.splice(i, 1);
									break;
								}
							}
							self.intro = undefined;
						}

						// Start level 1!
						self.start(1);
					});

				positionTween.to({ y: -Math.abs(bounds.max.y) }, RPYeti.config.character.yeti.disappearDuration).start();
			}, 2000);
		});
	})(this);
};

RPYeti.Gameplay.prototype.spawnYeti = function (group, position, scale) {
	var yeti = new RPYeti.Yeti(group),
		cameraPos = this.game.camera.getWorldPosition(),
		blockers = [ this.game.trees, this.yetis ],
		tries = 100;

	if (position === undefined) {
		while (tries-- > 0) {
			var x = Math.floor(Math.random() * (RPYeti.config.character.maxX - RPYeti.config.character.minX + 1) + RPYeti.config.character.minX),
				z = Math.floor(Math.random() * (RPYeti.config.character.maxZ - RPYeti.config.character.minZ + 1) + RPYeti.config.character.minZ);

			yeti.position(x, z, scale, cameraPos);
			if (!yeti.isBlocked(cameraPos, blockers) && yeti.pivot.position.distanceTo(cameraPos) > 40) {
				break;
			}
		}
	} else {
		yeti.position(position.x, position.z, scale, cameraPos);
	}

	yeti.hide();

	return yeti;
};

RPYeti.Gameplay.prototype.sampleYetiSpawner = function () {
	/** SAMPLE YETI SPAWNER **/
	function upd(gp) {
		if (gp.characters.yetis.count < 20) {
			var yeti = gp.spawnYeti(gp.yetis);

			yeti.setAction(function (context) {
				var pos = context.pivot.position.clone();
				pos.y = context.handHeight;

				gp.game.throwSnowball(pos, context);
			});

			yeti.on('appear', function (context) {
				if( context.roar ) {
					context.roar.stop();
					context.roar.isPlaying = false;
				} else {
					context.roar = new THREE.PositionalAudio( gp.game.listener );
					context.roar.setBuffer( RPYeti.loader.sounds.roar );
					context.pivot.add( context.roar );
				}
				// delay roar by random amount to distinguish different yetis
				setTimeout(function() {
					context.roar.play();
				}, Math.floor((Math.random() * 300)) );

				context.fireCount = 0;
				context.setTimeout(context.action, 2000);
			});

			yeti.on('disappear', function (context) {
				context.setTimeout(context.appear, 5000);
			});

			yeti.on('action', function (context) {
				context.setTimeout(function () {
					if (context.fireCount < 2) {
						context.action();
					} else {
						context.disappear();
					}
					context.fireCount++;
				}, 3000);
			});

			yeti.on('defeat', function (context, param) {
				if (param !== undefined
					&& param.userData.initiator !== undefined
					&& param.userData.initiator instanceof RPYeti.Yeti) {

					gp.game.hud.addText('Yeti-on-yeti Violence');
				} else if (param.userData.initiator == gp.game.player) {
					gp.game.player.trigger('yeti.defeat', context);
					gp.game.hud.addText('Yeti Down! ' + gp.game.player.points);
				} else {
					gp.game.hud.addText('Something Else Did It');
				}
			});

			yeti.on('defeated', function (context) {
				delete gp.characters.yetis.objs[context.model.id];
				gp.characters.yetis.count--;

				context.setTimeout(context.remove, 1500);
			});

			yeti.appear();

			gp.characters.yetis.objs[yeti.model.id] = yeti;
			gp.characters.yetis.count++;
		}

		setTimeout(function () {
			upd(gp);
		}, 10000);
	}
	upd(this);
	/** END SAMPLE YETI SPAWNER **/
};