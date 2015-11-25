var RPYeti = RPYeti || {};

RPYeti.character = RPYeti.character || {};

RPYeti.character.yeti = function(group) {
	var self;

	return ({

		group: group,
		events: [],
		isDefeated: false,

		init: function() {
			self = this;

			self.model = RPYeti.loader.models.yeti.clone();
			self.model.userData.character = self;
			self.model.name = "yeti"

			self.model.traverse(function(child) {
				child.userData.character = self;
			});

			self.pivot = new THREE.Object3D();
			self.pivot.name = "yeti pivot"
			self.pivot.add(self.model);

			group.add(self.pivot);

			return self;
		},

		remove: function () {
			group.remove(self.pivot);
		},

		on: function (evt, action) {
			if (evt !== undefined && typeof action === 'function') {
				self.events[evt] = action;
			}
		},

		trigger: function (evt) {
			if (self.events[evt] !== undefined && typeof self.events[evt] === 'function') {
				self.events[evt](self);
			}
		},

		action: function () {
			if (!self.isDefeated) {
				if (typeof self.act === 'function') {
					self.act(self);
				}

				self.trigger('action');
			}
		},

		setAction: function (act) {
			if (typeof act === 'function') {
				self.act = act;
			}
		},

		position: function (x, z, scale, lookAtPos) {
			if (scale !== undefined && scale instanceof THREE.Vector3 ) {
				self.model.scale.set( scale.x, scale.y, scale.z );
			} else if (scale !== undefined) {
				self.model.scale.set( scale, scale, scale );
			}

			self.pivot.translateX( x );
			self.pivot.translateY( 10 );
			self.pivot.translateZ( z );

			if (lookAtPos instanceof THREE.Vector3) {
				self.pivot.lookAt(lookAtPos);
			}

			self.hide();
		},

		hide: function () {
			self.model.rotation.set(0, 0, 0);
			self.bounds = new THREE.Box3().setFromObject(self.model);
			self.pivot.translateY(-(Math.abs(self.bounds.max.y) + Math.abs(self.bounds.min.y)));
		},

		appear: function () {
			self.positionTween = new TWEEN.Tween(self.pivot.position)
				.easing(RPYeti.config.character.yeti.appearEasing)
				.onComplete(function () {
					self.trigger('appear');
				});

			self.positionTween.to({ y: Math.abs(self.bounds.max.y) }, RPYeti.config.character.yeti.appearDuration).start();
		},

		disappear: function () {
			self.positionTween = new TWEEN.Tween(self.pivot.position)
				.easing(RPYeti.config.character.yeti.disappearEasing)
				.onComplete(function () {
					self.trigger('disappear');
				});

			self.positionTween.to({ y: -Math.abs(self.bounds.max.y) }, RPYeti.config.character.yeti.disappearDuration).start();
		},

		hit: function () {
			self.trigger('hit');
			self.defeat();
		},

		defeat: function () {
			self.trigger('defeat');
			if (!self.isDefeated) {
				self.isDefeated = true;

				var positionTween = new TWEEN.Tween({ rx: self.model.rotation.x, py: self.pivot.position.y })
					.easing(RPYeti.config.character.yeti.defeatEasing)
					.onUpdate(function () {
						self.model.rotation.x = this.rx;
						self.pivot.position.y = this.py;
					}).onComplete(function () {
						self.trigger('defeated');
					});

				positionTween.to({ rx: "-" + Math.PI/2, py: 0 }, RPYeti.config.character.yeti.defeatDuration).start();
			}
		}

	}).init();

};
