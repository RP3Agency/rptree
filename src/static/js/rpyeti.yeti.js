var RPYeti = RPYeti || {};

RPYeti.Yeti = function (group) {
	RPYeti.Character.call( this );

	this.name = '';
	this.type = 'Yeti';

	this.health = RPYeti.config.character.yeti.health;
	this.group = group;

	this.model = RPYeti.loader.models.yeti.clone();
	this.model.userData.character = this;
	this.model.name = 'yeti model';

	this.pivot.add(this.model);

	(function (self) {
		self.model.traverse(function(child) {
			child.userData.character = self;
		});
	})(this);

	group.add(this.pivot);
};

RPYeti.Yeti.prototype = Object.create( RPYeti.Character.prototype );
RPYeti.Yeti.prototype.constructor = RPYeti.Yeti;

RPYeti.Yeti.prototype.position = function (x, z, scale, lookAtPos) {
	RPYeti.Character.prototype.position.call( this, x, z, scale, lookAtPos );
};

RPYeti.Yeti.prototype.hide = function () {
	this.model.rotation.set(0, 0, 0);
	this.model.position.y = 8.5;
	this.model.position.x = -2;

	this.bounds = new THREE.Box3().setFromObject(this.model);
	this.pivot.translateY(-(Math.abs(this.bounds.max.y) + Math.abs(this.bounds.min.y)));
};

RPYeti.Yeti.prototype.appear = function () {
	(function (self) {
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

		(function (self) {
			var positionTween = new TWEEN.Tween({ rx: self.model.rotation.x, my: self.model.position.y, py: self.pivot.position.y })
				.easing(RPYeti.config.character.yeti.defeatEasing)
				.onUpdate(function () {
					self.model.rotation.x = this.rx;
					self.model.position.y = this.my;
					self.pivot.position.y = this.py;
				}).onComplete(function () {
					self.trigger('defeated', byObject);
				});

			positionTween.to({ rx: "-" + Math.PI/2, my: 0, py: 1 }, RPYeti.config.character.yeti.defeatDuration).start();
		})(this);
	}
};
