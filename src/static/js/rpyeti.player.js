var RPYeti = RPYeti || {};

RPYeti.Player = function () {
	RPYeti.Character.call( this );

	this.name = ''
	this.type = 'Player'
}

RPYeti.Player.prototype = Object.create( RPYeti.Character.prototype );
RPYeti.Player.prototype.constructor = RPYeti.Player;
