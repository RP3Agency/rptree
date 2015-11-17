var RPYeti = RPYeti || {};

RPYeti.config = {

	/** Default Settings **/

	stereo: false,
	cardboard: {
		fov: 60,
		focalLength: 15,
	},
	desktop: {
		fov: 45,
	},

	trees: [
		[300, -125],
		[300, 115],
		[100, -20],
		[100, 10],
		[50, -30],
		[70, -2.5],
		[50, 30],
		[-10, 0],
	],

	/** Debug Settings **/
	wireframe: false,

	/** Constructor **/

	init: function() {
		// Detect stereo request
		this.stereo = ( window.location.hash != '#desktop' );

	},
};

RPYeti.config.init();
