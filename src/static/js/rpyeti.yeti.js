var RPYeti = RPYeti || {};

RPYeti.Yeti = function (group) {
	RPYeti.Character.call( this );

	this.name = '';
	this.type = 'Yeti';

	this.health = RPYeti.config.character.yeti.health;
	this.points = RPYeti.config.character.yeti.points;
	this.group = group;
	this.handHeight = 12;
	this.xoffset = 5;
	this.yoffset = -0.5;

	this.model = RPYeti.loader.models.yeti.clone();
	this.model.userData.character = this;
	this.model.name = 'yeti model';

	this.prethrow = RPYeti.loader.models.yeti_prethrow.clone();
	this.prethrow.userData.character = this;
	this.prethrow.name = 'yeti prethrow'

	this.throw = RPYeti.loader.models.yeti_throw.clone();
	this.throw.userData.character = this;
	this.throw.name = 'yeti throw'

	this.pivot.add(this.model);
	this.pivot.add(this.prethrow);
	this.pivot.add(this.throw);

	(function (self) {
		self.model.traverse(function(child) {
			child.userData.character = self;
		});
		self.prethrow.traverse(function(child) {
			child.userData.character = self;
		});
		self.throw.traverse(function(child) {
			child.userData.character = self;
		});
	})(this);

	group.add(this.pivot);
};

RPYeti.Yeti.prototype = Object.create( RPYeti.Character.prototype );
RPYeti.Yeti.prototype.constructor = RPYeti.Yeti;

RPYeti.Yeti.prototype.action = function () {
	if (!this.isDefeated) {
		this.model.visible = false;
		this.prethrow.visible = true;
		this.throw.visible = false;

		this.setTimeout(function () {
			this.model.visible = false;
			this.prethrow.visible = false;
			this.throw.visible = true;

			RPYeti.Character.prototype.action.call( this );

			this.setTimeout(function () {
				this.resetModel();
			}, 750);
		}, 500);
	}
};

RPYeti.Yeti.prototype.position = function (x, z, scale, lookAtPos) {
	RPYeti.Character.prototype.position.call( this, x, z, scale, lookAtPos );

	this.prethrow.position.x = this.xoffset;
	this.prethrow.position.y = this.yoffset;

	this.throw.position.x = this.xoffset;
	this.throw.position.y = this.yoffset;

	this.resetModel();
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
		this.resetModel();

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
	RPYeti.Character.prototype.hit.call( this, byObject );
};

RPYeti.Yeti.prototype.defeat = function (byObject) {
	if (!this.isDefeated) {
		RPYeti.Character.prototype.defeat.call( this, byObject );

		this.resetModel();

		(function (self) {
			var positionTween = new TWEEN.Tween({ rx: self.model.rotation.x, py: self.pivot.position.y })
				.easing(RPYeti.config.character.yeti.defeatEasing)
				.onUpdate(function () {
					self.model.rotation.x = this.rx;
					self.pivot.position.y = this.py;
				}).onComplete(function () {
					self.trigger('defeated', byObject);
				});

			positionTween.to({ rx: "-" + Math.PI/2, py: 0.5 }, RPYeti.config.character.yeti.defeatDuration).start();
		})(this);
	}
};

RPYeti.Yeti.prototype.resetModel = function () {
	this.model.visible = true;
	this.prethrow.visible = false;
	this.throw.visible = false;
}