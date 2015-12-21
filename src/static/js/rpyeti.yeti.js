var RPYeti = RPYeti || {};

RPYeti.Yeti = function (group, health, points) {
	RPYeti.Character.call( this );

	this.name = '';
	this.type = 'Yeti';

	this.health = health || 0;
	this.points = points || 0;
	this.group = group;
	this.handHeight = 12;
	this.xoffset = 5;
	this.yoffset = -0.5;

	this.pivot.userData.character = this;

	this.model = {
		normal: RPYeti.loader.models.yeti.clone(),
		prethrow: RPYeti.loader.models.yeti_prethrow.clone(),
		throw: RPYeti.loader.models.yeti_throw.clone(),
		wince: RPYeti.loader.models.yeti_wince.clone()
	}

	this.model.normal.name = 'yeti model';
	this.model.prethrow.name = 'yeti prethrow';
	this.model.throw.name = 'yeti throw';
	this.model.wince.name = 'yeti wince';

	(function (self) {
		for (var i in self.model) {
			self.model[i].userData.character = self;
			self.pivot.add(self.model[i]);

			self.model[i].traverse(function (child) {
				child.userData.character = self;
			});
		}
	})(this);

	group.add(this.pivot);
};

RPYeti.Yeti.prototype = Object.create( RPYeti.Character.prototype );
RPYeti.Yeti.prototype.constructor = RPYeti.Yeti;

RPYeti.Yeti.prototype.action = function () {
	if (!this.isDefeated) {
		this.prethrowModel();

		this.setTimeout(function () {
			this.throwModel();

			RPYeti.Character.prototype.action.call( this );

			this.setTimeout(function () {
				this.normalModel();
			}, 750);
		}, 500);
	}
};

RPYeti.Yeti.prototype.position = function (x, z, scale, lookAtPos) {
	RPYeti.Character.prototype.position.call( this, x, z, scale, lookAtPos );
	this.normalModel();
};

RPYeti.Yeti.prototype.hide = function () {
	RPYeti.Character.prototype.hide.call( this );
};

RPYeti.Yeti.prototype.appear = function () {
	(function (self) {
		self.pivot.visible = true;

		self.positionTween = new TWEEN.Tween(self.pivot.position)
			.easing(RPYeti.config.character.yeti.appearEasing)
			.onComplete(function () {
				RPYeti.Character.prototype.appear.call( self );
			});

		self.positionTween.to({ y: Math.abs(self.bounds.max.y) }, RPYeti.config.character.yeti.appearDuration).start();
	})(this);
};

RPYeti.Yeti.prototype.disappear = function () {
	if (!this.isDefeated) {
		this.normalModel();

		(function (self) {
			self.positionTween = new TWEEN.Tween(self.pivot.position)
				.easing(RPYeti.config.character.yeti.disappearEasing)
				.onComplete(function () {
					RPYeti.Character.prototype.disappear.call( self );
				});

			self.positionTween.to({ y: -Math.abs(self.bounds.max.y) }, RPYeti.config.character.yeti.disappearDuration).start();
		})(this);
	}
};

RPYeti.Yeti.prototype.hit = function (byObject) {
	this.winceModel();

	(function (self) {
		self.setTimeout(function () {
			if (!self.isDefeated) {
				self.normalModel();
			}
		}, 750);
	});

	RPYeti.Character.prototype.hit.call( this, byObject );
};

RPYeti.Yeti.prototype.defeat = function (byObject) {
	if (!this.isDefeated) {
		RPYeti.Character.prototype.defeat.call( this, byObject );

		this.winceModel();

		(function (self) {
			var model = self.getActiveModel();

			self.positionTween = new TWEEN.Tween({ rx: model.rotation.x, py: self.pivot.position.y })
				.easing(RPYeti.config.character.yeti.defeatEasing)
				.onUpdate(function () {
					model.rotation.x = this.rx;
					self.pivot.position.y = this.py;
				}).onComplete(function () {
					self.trigger('defeated', byObject);
				});

			self.positionTween.to({ rx: "-" + Math.PI/2, py: 0.5 }, RPYeti.config.character.yeti.defeatDuration).start();
		})(this);
	}
};

RPYeti.Yeti.prototype.getActiveModel = function () {
	for (var i in this.model) {
		if (this.model[i].visible) {
			return this.model[i];
		}
	}

	return this.model.normal;
}

RPYeti.Yeti.prototype.resetModel = function () {
	for (var i in this.model) {
		this.model[i].visible = false;
	}
}

RPYeti.Yeti.prototype.normalModel = function () {
	this.resetModel();
	this.model.normal.visible = true;
}


RPYeti.Yeti.prototype.prethrowModel = function () {
	this.resetModel();
	this.model.prethrow.visible = true;
}

RPYeti.Yeti.prototype.throwModel = function () {
	this.resetModel();
	this.model.throw.visible = true;
}

RPYeti.Yeti.prototype.winceModel = function () {
	this.resetModel();
	this.model.wince.visible = true;
}