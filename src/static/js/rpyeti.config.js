var RPYeti = RPYeti || {};

RPYeti.config = {

	/** Default Settings **/

	stereo: false,
	cardboard: {
		fov: 75,
		focalLength: 800,
		eyeSeparation: 3,
		pupillaryBaseline: 667
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
		[70, 100],
		[50, 30],
		[-30, 0],
		[800, 0],
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
