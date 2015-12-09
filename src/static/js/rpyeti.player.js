var RPYeti = RPYeti || {};

RPYeti.Player = function () {
	RPYeti.Character.call( this );

	this.name = '';
	this.type = 'Player';

	this.health = RPYeti.config.player.health;
	this.isDefeated = false;
}

RPYeti.Player.prototype = Object.create( RPYeti.Character.prototype );
RPYeti.Player.prototype.constructor = RPYeti.Player;

RPYeti.Player.prototype.hit = function (byObject) {
	RPYeti.Character.prototype.hit.call( this, byObject );
};

RPYeti.Player.prototype.defeat = function (byObject) {
	if (!this.isDefeated) {
		RPYeti.Character.prototype.defeat.call( this, byObject );
		this.trigger('defeated', byObject);
	}
};