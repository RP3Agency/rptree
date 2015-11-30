var RPYeti = RPYeti || {};

RPYeti.Player = function () {
	RPYeti.Character.call( this );

	this.name = ''
	this.type = 'Player'

	this.health = RPYeti.config.player.health;
}

RPYeti.Player.prototype = Object.create( RPYeti.Character.prototype );
RPYeti.Player.prototype.constructor = RPYeti.Player;

RPYeti.Player.prototype.hit = function (byObject) {
	if (this.health > 0 && byObject && byObject.userData && byObject.userData.damage) {
		this.health -= byObject.userData.damage;
	}
	RPYeti.Character.prototype.hit.call( this, byObject );
};