var RPYeti = RPYeti || {};

RPYeti.config = {

	/** Default Settings **/

	stereo: false,
	cardboard: {
		fov: 90,
		eyeSeparation: 3,
		focalLength: 15,
	},
	desktop: {
		fov: 45,
	},

	trees: [
		[100, -20],
		[100, 10],
		[50, -30],
		[70, -2.5],
		[50, 30],
		[-50, 0],
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
