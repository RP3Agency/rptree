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
			RPYeti.music.publisher.trigger('rpyeti.music.lose');
			self.game.hud.addText(RPYeti.config.dialogs.gameOver, 0);
		});

		self.player.on('hit', function (context) {
			if (!context.lowHealthTrigger && context.health < RPYeti.config.player.lowHealth) {
				context.lowHealthTrigger = true;
				RPYeti.music.publisher.trigger('rpyeti.music.lowhealth');
			}

			self.game.hud.updateReticle();
		});

		self.player.on('yeti.defeat', function (context, yeti) {
			context.points += yeti.points;
			self.currentLevelDefeated++;

			RPYeti.service.publisher.trigger('rpyeti.game.score', context.points);
		});

		self.player.on('yeti.defeated', function (context, yeti) {
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
	this.player.lowHealthTrigger = false;

	if (level == 0) {
		RPYeti.music.publisher.trigger('rpyeti.music.selection');
		this.startIntro();
	} else {
		RPYeti.music.publisher.trigger('rpyeti.music.fight');
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
	this.game.hud.addText('Level Complete\nScore: ' + this.player.points, 9600);

	RPYeti.music.publisher.trigger('rpyeti.music.win');

	(function (self) {
		self.stopTimer();
		self.player.setTimeout(function () {
			self.start(self.level + 1);
		}, 9600);
	})(this);
};

RPYeti.Gameplay.prototype.startIntro = function () {
	var introPoints = RPYeti.loader.maps.main.intro,
		signs = [ RPYeti.loader.models.sign_cn, RPYeti.loader.models.sign_ja, RPYeti.loader.models.sign_wawf ],
		treeModel = RPYeti.loader.models.decoratedtree,
		treeScale = 5,
		signScale = 4,
		density = RPYeti.loader.maps.main.density,
		cameraPos = this.camera.getWorldPosition(),
		centerPos = null;

		if (this.intro !== undefined) {
			this.scene.remove(this.intro);
			while (this.intro.children.length) { this.intro.children.pop(); }
		}

		cameraPos.y = treeModel.position.y;

		this.intro = new THREE.Group();
		for (var i = 0; i < introPoints.length; i++) {
			var tree = treeModel.clone(),
				x = introPoints[i][0] * density,
				z = introPoints[i][1] * density;

			tree.translateX(x + 8);
			tree.translateZ(z);
			tree.scale.set(treeScale, treeScale, treeScale);

			tree.lookAt(cameraPos);
			this.intro.add(tree);

			centerPos = tree.position.clone();

			(function (self, position) {
				position.x += 10;
				position.z -= 15;
				setTimeout(function () {
					self.spawnYeti(self.intro, position, undefined, 1.85, 9001, 0);
				});
			})(this, tree.position.clone());
		}

		if (centerPos != null && signs.length > 0) {
			var xOffset = 12;

			cameraPos.y = signs[0].position.y;

			centerPos.x -= 15;
			centerPos.z -= xOffset * Math.floor(signs.length / 2);

			for (var i = 0; i < signs.length; i++) {
				signs[i].position.set(centerPos.x, centerPos.y, centerPos.z);
				signs[i].scale.set(signScale, signScale, signScale);

				signs[i].lookAt(cameraPos);

				this.intro.add(signs[i]);

				centerPos.z += xOffset;
			}
		}

		this.scene.add(this.intro);
		this.game.snowballBlockers.push(this.intro);

		(function (self) {
			self.player.setTimeout(function () {
				self.game.hud.addText(RPYeti.config.dialogs.select, 0);
			}, 1000);

			self.player.on('intro.select', function (context, number) {
				var pattern = /decoration_(.*)/i;
				if (number.match(pattern)) {
					context.selected = number.replace(pattern, '$1');

					RPYeti.service.publisher.trigger('rpyeti.game.charity', context.selected);

					self.endIntro(number);
				}
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

	(function (self) {
		yeti.on('appear', function (context) {
			context.roar = new THREE.PositionalAudio( self.game.listener );
			context.roar.setBuffer( RPYeti.loader.sounds.yeti_roar );
			context.pivot.add( context.roar );

			RPYeti.music.publisher.trigger('rpyeti.music.theft');
			self.game.hud.addText('', 0);
			self.game.hud.addText(RPYeti.config.dialogs.exclamation);

			var bounds = new THREE.Box3().setFromObject(self.intro);
			context.setTimeout(function () {
				var positionTween = new TWEEN.Tween(self.intro.position)
					.easing(RPYeti.config.character.yeti.disappearEasing)
					.onComplete(function () {
						// Cleanup
						if (self.intro !== undefined) {
							self.intro.visible = false;
							self.scene.remove(self.intro);
							for (var i = self.game.snowballBlockers.length + 1; i > 0; i--) {
								if (self.game.snowballBlockers[i] == self.intro) {
									self.game.snowballBlockers.splice(i, 1);
									break;
								}
							}
							while (self.intro.children.length) { self.intro.children.pop(); }
							delete self.intro;
						}

						// TODO: Move this seque to dialog
						context.setTimeout(function () {
							// Start level 1!
							self.start(1);
						}, 9600)
						self.game.hud.addText(RPYeti.config.dialogs.introSeque, 9600);
					});

				positionTween.to({ y: -Math.abs(bounds.max.y) }, RPYeti.config.character.yeti.disappearDuration).start();
			}, 3000);
		});
	})(this);
};

RPYeti.Gameplay.prototype.spawnYeti = function (group, position, lookAt, scale, health, points) {
	var yeti = new RPYeti.Yeti(group, health, points),
		cameraPos = this.camera.getWorldPosition(),
		lookAt = lookAt || cameraPos,
		blockers = [ this.game.trees, this.yetis ],
		tries = 100;

	if (position === undefined) {
		while (tries-- > 0) {
			var x = this.random(RPYeti.config.character.maxX, RPYeti.config.character.minX),
				z = this.random(RPYeti.config.character.maxZ, RPYeti.config.character.minZ);

			yeti.position(x, z, scale, lookAt);
			if (!yeti.isBlocked(cameraPos, blockers) && yeti.pivot.position.distanceTo(cameraPos) > 40) {
				break;
			}
		}
	} else {
		yeti.position(position.x, position.z, scale, lookAt);
	}

	yeti.hide();

	return yeti;
};

RPYeti.Gameplay.prototype.yetiSpawner = function () {
	if (this.characters.yetis.count < this.settings.yeti.maxOnScreen && (this.currentLevelDefeated + this.characters.yetis.count) < this.settings.yeti.total) {
		var yeti = this.spawnYeti(this.yetis, undefined, undefined, undefined, this.settings.yeti.health, this.settings.yeti.points);

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
					context.roar.setBuffer( RPYeti.loader.sounds.yeti_roar );
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

					self.game.hud.addText(RPYeti.config.dialogs.yetiOnYeti);
				} else if (param.userData.initiator == self.player) {
					self.player.trigger('yeti.defeat', context);
					self.game.hud.addText(RPYeti.config.dialogs.yetiDowned
						+ ' ' + self.player.points + '\n'
						+ (self.settings.yeti.total - self.currentLevelDefeated) + ' ' + RPYeti.config.dialogs.remaining);
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
