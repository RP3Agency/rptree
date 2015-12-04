var RPYeti = RPYeti || {};

RPYeti.Gameplay = function (game, player, camera, scene) {
	this.game = game;
	this.player = player;
	this.camera = camera;
	this.scene = scene;
	this.level = 0;

	this.characters = { yetis: { count: 0, objs: {} } };

	this.yetis = new THREE.Group();
	this.scene.add( this.yetis );

	this.settings = jQuery.extend(true, {}, RPYeti.config.gamePlayBaseline);

	(function (self) {
		self.player.on('defeated', function (context) {
			self.game.hud.addText('GAME OVER', 0);
		});

		self.player.on('hit', function (context) {
			self.game.hud.updateReticle();
		});

		self.player.on('yeti.defeat', function (context, yeti) {
			context.points += yeti.points;
		});

		self.player.on('yeti.defeated', function (context, yeti) {
			self.currentLevelDefeated++;
			self.nextRound();
		})
	})(this);
};

RPYeti.Gameplay.prototype.constructor = RPYeti.Gameplay;

RPYeti.Gameplay.prototype.start = function (level, reset) {
	this.level = level;

	if (reset) {
		this.player.points = 0;
	}

	this.player.health = RPYeti.config.player.health;

	if (level == 0) {
		this.startIntro();
	} else {
		this.levelBegin(level);
	}
};

RPYeti.Gameplay.prototype.levelBegin = function (level) {
	this.game.hud.addText('Level ' + level);

	delete this.settings
	this.settings = jQuery.extend(true, {}, RPYeti.config.gameplay.baseline);
	this.currentLevelDefeated = 0;

	this.modSettings(this.settings, RPYeti.config.gameplay.modifiers, (level - 1));
	this.nextRound();
};

RPYeti.Gameplay.prototype.setTimer = function () {
	if (this.popTimer === undefined || this.popTimer.expired) {
		(function (self) {
			self.popTimer = self.player.setTimeout(function () {
				delete self.popTimer;

				self.yetiSpawner();
				self.setTimer();
			}, self.random(self.settings.popTimer));
		})(this);
	}
}

RPYeti.Gameplay.prototype.stopTimer = function () {
	this.player.clearTimer(this.popTimer);
	delete this.popTimer;
}

RPYeti.Gameplay.prototype.nextRound = function () {
	if (this.currentLevelDefeated >= this.settings.yeti.total) {
		this.levelComplete();
	} else {
		this.setTimer();
	}
};

RPYeti.Gameplay.prototype.levelComplete = function () {
	this.game.hud.addText('Level Complete\nScore: ' + this.player.points);
	(function (self) {
		self.stopTimer();
		self.player.setTimeout(function () {
			self.start(self.level + 1);
		}, 5000);
	})(this);
};

RPYeti.Gameplay.prototype.startIntro = function () {
	var introPoints = RPYeti.loader.maps.main.intro,
		treeModel = RPYeti.loader.models.tree,
		signModel = RPYeti.loader.models.sign,
		scale = 4,
		density = RPYeti.loader.maps.main.density,
		cameraPos = this.camera.getWorldPosition();

		if (this.intro !== undefined) {
			this.scene.remove(this.intro);
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

			(function (tree, sign) {
				tree.traverse(function (child) {
					child.userData = tree.userData;
				});
				sign.traverse(function (child) {
					child.userData = sign.userData;
				});
			})(tree, sign);

			this.intro.add( sign );

			var position = tree.position.clone();
			position.x += 10;
			position.z -= 5;

			yeti = this.spawnYeti(this.intro, position, 1.35, 9001, 0);
		}

		this.scene.add(this.intro);
		this.game.snowballBlockers.push(this.intro);

		(function (self) {
			self.player.on('intro.select', function (context, number) {
				context.selected = number;

				// TODO: Something with selection
				console.log('selected ' + number);

				self.endIntro(number);
			});
		})(this);
};

RPYeti.Gameplay.prototype.endIntro = function (number) {
	var yeti = null;

	this.player.on('intro.select', function () {});

	for (var i in this.intro.children) {
		if (this.intro.children[i].userData && this.intro.children[i].userData.character instanceof RPYeti.Yeti) {
			yeti = this.intro.children[i].userData.character;
			yeti.appear();
		}
	}

	if (yeti === null) {
		return;
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
							self.scene.remove(self.intro);
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

RPYeti.Gameplay.prototype.spawnYeti = function (group, position, scale, health, points) {
	var yeti = new RPYeti.Yeti(group, health, points),
		cameraPos = this.camera.getWorldPosition(),
		blockers = [ this.game.trees, this.yetis ],
		tries = 100;

	if (position === undefined) {
		while (tries-- > 0) {
			var x = this.random(RPYeti.config.character.maxX, RPYeti.config.character.minX),
				z = this.random(RPYeti.config.character.maxZ, RPYeti.config.character.minZ);

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

RPYeti.Gameplay.prototype.yetiSpawner = function () {
	if (this.characters.yetis.count < this.settings.yeti.maxOnScreen && (this.currentLevelDefeated + this.characters.yetis.count) < this.settings.yeti.total) {
		var yeti = this.spawnYeti(this.yetis, undefined, undefined, this.settings.yeti.health, this.settings.yeti.points);

		this.characters.yetis.objs[yeti.model.id] = yeti;
		this.characters.yetis.count++;

		(function (self, yeti) {
			yeti.setAction(function (context) {
				var pos = context.pivot.position.clone();
				pos.y = context.handHeight;

				self.game.throwSnowball(pos, context);
			});

			yeti.on('appear', function (context) {
				if (context.roar) {
					context.roar.stop();
					context.roar.isPlaying = false;
				} else {
					context.roar = new THREE.PositionalAudio( self.game.listener );
					context.roar.setBuffer( RPYeti.loader.sounds.roar );
					context.pivot.add( context.roar );
				}

				context.roar.play();

				context.throwCount = self.random(self.settings.yeti.throwCount);
				context.setTimeout(context.action, self.random(self.settings.yeti.throwDelay));
			});

			yeti.on('disappear', function (context) {
				context.setTimeout(context.appear, self.random(self.settings.yeti.appearDelay));
			});

			yeti.on('action', function (context) {
				context.throwCount--;
				context.setTimeout(function () {
					if (context.throwCount > 0) {
						context.action();
					} else {
						context.disappear();
					}
				}, self.random(self.settings.yeti.throwDelay));
			});

			yeti.on('defeat', function (context, param) {
				if (param !== undefined
					&& param.userData.initiator !== undefined
					&& param.userData.initiator instanceof RPYeti.Yeti) {

					self.game.hud.addText('Yeti Crossfire');
				} else if (param.userData.initiator == self.player) {
					self.player.trigger('yeti.defeat', context);
					self.game.hud.addText('Yeti Down! ' + self.player.points);
				} else {
					self.game.hud.addText('Something Else Did It');
				}
			});

			yeti.on('defeated', function (context) {
				delete self.characters.yetis.objs[context.model.id];
				self.characters.yetis.count--;

				self.player.trigger('yeti.defeated');

				context.setTimeout(context.remove, 1500);
			});

			yeti.appear();
		})(this, yeti);
	}
};

RPYeti.Gameplay.prototype.modSettings = function (settings, modifiers, level) {
	for (var i in settings) {
		if (typeof settings[i] === 'object' && typeof modifiers[i] == 'object') {
			this.modSettings(settings[i], modifiers[i], level);
		} else if (typeof modifiers[i] === 'function') {
			settings[i] += modifiers[i](level);;
			if (settings[i] < 0) {
				settings[i] = 0;
			}
		}
	}
}

RPYeti.Gameplay.prototype.random = function (min, max) {
	if (typeof min == 'object') {
		max = min.max;
		min = min.min;
	}
	return Math.floor(Math.random() * (max - min + 1) + min);
};