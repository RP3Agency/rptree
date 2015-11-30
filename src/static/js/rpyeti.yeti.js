var RPYeti = RPYeti || {};

RPYeti.Yeti = function (group) {
	RPYeti.Character.call( this );

	this.name = ''
	this.type = 'Yeti';

	this.model = RPYeti.loader.models.yeti.clone();
	this.model.userData.character = this;
	this.model.name = 'yeti model';

	(function (self) {
		self.model.traverse(function(child) {
			child.userData.character = self;
		});
	})(this);

	this.pivot.add(this.model);

	this.group = group;
	group.add(this.pivot);
};

RPYeti.Yeti.prototype = Object.create( RPYeti.Character.prototype );
RPYeti.Yeti.prototype.constructor = RPYeti.Yeti;

RPYeti.Yeti.prototype.position = function (x, z, scale, lookAtPos) {
	if (scale !== undefined && scale instanceof THREE.Vector3 ) {
		this.model.scale.set( scale.x, scale.y, scale.z );
	} else if (scale !== undefined) {
		this.model.scale.set( scale, scale, scale );
	}

	this.pivot.translateX( x );
	this.pivot.translateY( 10 );
	this.pivot.translateZ( z );

	if (lookAtPos instanceof THREE.Vector3) {
		this.pivot.lookAt(lookAtPos);
	}

	this.hide();

	RPYeti.Character.prototype.position.call( this, x, z, scale, lookAtPos );
};

RPYeti.Yeti.prototype.hide = function () {
	this.model.rotation.set(0, 0, 0);
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
	(function (self) {
		self.positionTween = new TWEEN.Tween(self.pivot.position)
			.easing(RPYeti.config.character.yeti.disappearEasing)
			.onComplete(function () {
				RPYeti.Character.prototype.disappear.call( self );
			});

		self.positionTween.to({ y: -Math.abs(self.bounds.max.y) }, RPYeti.config.character.yeti.disappearDuration).start();
	})(this);
};

RPYeti.Yeti.prototype.hit = function (byObject) {
	RPYeti.Character.prototype.hit.call( this, byObject );
	this.defeat(byObject);
};

RPYeti.Yeti.prototype.defeat = function (byObject) {
	(function (self) {
		if (!self.isDefeated) {
			RPYeti.Character.prototype.defeat.call( self, byObject );

			var positionTween = new TWEEN.Tween({ rx: self.model.rotation.x, py: self.pivot.position.y })
				.easing(RPYeti.config.character.yeti.defeatEasing)
				.onUpdate(function () {
					self.model.rotation.x = this.rx;
					self.pivot.position.y = this.py;
				}).onComplete(function () {
					self.trigger('defeated', byObject);
				});

			positionTween.to({ rx: "-" + Math.PI/2, py: 0 }, RPYeti.config.character.yeti.defeatDuration).start();
		}
	})(this);
};
