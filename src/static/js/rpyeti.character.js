var RPYeti = RPYeti || {};

RPYeti.Character = function () {
	Object.defineProperty( this, 'id', { value: RPYeti.CharacterCount++ } );

	this.name = '';
	this.type = 'Character';

	this.pivot = new THREE.Object3D();
	this.pivot.name = 'Character pivot'

	this.isDefeated = false;
	this.events = {};
	this.timers = [];
	this.health = 0;
	this.points = 0;
	this.handHeight = 0;
	this.xoffset = 0;
	this.yoffset = 0;
};

RPYeti.Character.prototype = {

	constructor: RPYeti.Character,

	remove: function () {
		if (this.group !== undefined) {
			this.group.remove(this.pivot);
		}
	},

	on: function (evt, action) {
		if (evt !== undefined && typeof action === 'function') {
			this.events[evt] = action;
		}
	},

	trigger: function (evt, param) {
		if (this.events[evt] !== undefined && typeof this.events[evt] === 'function') {
			this.events[evt](this, param);
		}
	},

	action: function () {
		if (!this.isDefeated) {
			if (typeof this.act === 'function') {
				this.act(this);
			}

			this.trigger('action');
		}
	},

	setAction: function (act) {
		if (typeof act === 'function') {
			this.act = act;
		}
	},

	position: function (x, z, scale, lookAtPos) {
		if (this.model !== undefined) {
			for (var i in this.model) {
				if (scale !== undefined && scale instanceof THREE.Vector3 ) {
					this.model[i].scale.set( scale.x, scale.y, scale.z );
				} else if (scale !== undefined) {
					this.model[i].scale.set( scale, scale, scale );
				}

				this.model[i].rotation.set(0, 0, 0);
				this.model[i].position.x = this.xoffset;
				this.model[i].position.y = this.yoffset;
			}
		}

		this.pivot.position.x = x;
		this.pivot.position.z = z;

		if (lookAtPos instanceof THREE.Vector3) {
			this.pivot.position.y = lookAtPos.y;
			this.pivot.lookAt(lookAtPos);
		}

		if (this.model.normal !== undefined) {
			if (this.bounds === undefined) {
				this.bounds = new THREE.Box3().setFromObject(this.model.normal);
			}

			this.pivot.position.y = Math.abs(this.bounds.max.y);
		}
	},

	isBlocked: function (target, objects) {
		this.pivot.updateMatrixWorld();

		var sources = [ this.pivot.getWorldPosition() ];
		if (this.model.normal !== undefined) {
			this.model.normal.updateMatrixWorld();
			sources.push(this.model.normal.getWorldPosition());
		}

		for (var s = 0; s < sources.length; s++) {
			var raycaster = new THREE.Raycaster(),
				distance = sources[s].distanceTo(target);

			raycaster.set(sources[s], target.clone().sub(sources[s]).normalize());
			raycaster.ray.at(1, sources[s]);

			var collisions = raycaster.intersectObjects(objects, true);
			for (var i = 0; i < collisions.length; i++) {
				if (collisions[i].object.userData.character != this && collisions[i].distance <= distance) {
					return true;
				} else if (collisions[i].distance > distance) {
					break;
				}
			}
		}

		return false;
	},

	hide: function () {
		this.pivot.translateY(-(Math.abs(this.bounds.max.y) + Math.abs(this.bounds.min.y) + 2));
		this.pivot.visible = false;
		this.trigger('hide');
	},

	appear: function () {
		this.pivot.visible = true;
		this.trigger('appear');
	},

	disappear: function () {
		this.pivot.visible = false;
		this.trigger('disappear');
	},

	hit: function (byObject) {
		if (this.health > 0 && byObject && byObject.userData && byObject.userData.damage) {
			this.health -= byObject.userData.damage;
		}

		if (this.health <= 0) {
			this.defeat(byObject);
		} else {
			this.trigger('hit', byObject);
		}
	},

	defeat: function (byObject) {
		this.isDefeated = true;
		this.clearTimers();
		this.trigger('defeat', byObject);
	},

	setTimeout: function (action, delay) {
		if (delay >= 0 && typeof action === 'function') {
			var timer = { action: action, delay: delay / 1000, object: this, expired: false };

			RPYeti.Character.timers.push(timer);
			this.timers.push(timer);

			return timer;
		}
	},

	cleanupTimers: function () {
		for (var i = this.timers.length - 1; i >= 0; i--) {
			if (this.timers[i] === undefined || this.timers[i].expired) {
				RPYeti.Character.timers.splice(i, 1);
			}
		}
	},

	clearTimer: function (timer, thisObjClean) {
		if (timer !== undefined) {
			timer.expired = true;

			if (!thisObjClean) {
				for (var i in this.timers) {
					if (this.timers[i] == timer) {
						delete this.timers[i];
						break;
					}
				}
			}

			for (var i in RPYeti.Character.timers) {
				if (RPYeti.Character.timers[i] == timer) {
					delete RPYeti.Character.timers[i];
					break;
				}
			}
		}
	},

	clearTimers: function () {
		while (this.timers.length > 0) {
			timer = this.timers.pop();
			this.clearTimer(timer, true);
		}
	}

};

RPYeti.CharacterCount = 0;

RPYeti.Character.timers = [];

RPYeti.Character.update = function (delta) {
	for (var i = RPYeti.Character.timers.length - 1; i >= 0; i--) {
		var context = RPYeti.Character.timers[i];
		if (context === undefined) {
			RPYeti.Character.timers.splice(i, 1);
			continue;
		}

		context.delay -= delta;
		if (context.delay <= 0) {
			context.action.call( context.object );
			context.expired = true;
			RPYeti.Character.timers.splice(i, 1);
		}
	}
}
