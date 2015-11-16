var RPYeti = RPYeti || {};

RPYeti.config = {

	/** Default Settings **/

	stereo: false,
	cardboard: {
		fov: 75,
		eyeSeparation: 1,
		focalLength: 15,
	},
	desktop: {
		fov: 45,
	},

	trees: [
		[10, -2],
		[10, 1],
		[5, -3],
		[7, -0.25],
		[5, 3],
		[-5, 0],
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
