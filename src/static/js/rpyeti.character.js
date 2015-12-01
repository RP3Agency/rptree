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
	},

	hide: function () {
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
		if (delay > 0 && typeof action === 'function') {
			var timer = { action: action, delay: delay / 1000, object: this };

			RPYeti.Character.timers.push(timer);
			this.timers.push(timer);
		}
	},

	clearTimers: function () {
		while (this.timers.length > 0) {
			timer = this.timers.pop();
			for (var i in RPYeti.Character.timers) {
				if (RPYeti.Character.timers[i] == timer) {
					delete RPYeti.Character.timers[i];
					break;
				}
			}
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
			RPYeti.Character.timers.splice(i, 1);
		}
	}
}
