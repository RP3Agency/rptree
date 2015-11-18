var RPYeti = RPYeti || {};

RPYeti.config = {

	/** Default Settings **/

	stereo: false,
	cardboard: {
		fov: 60,
		focalLength: 25,
	},
	desktop: {
		fov: 45,
	},

	/** Game Mechanics **/

	snowball: {
		size: 1,
		lod: 8,
		speed: 20000,
		range: 300,
		rate: 200,
	},

	/** Model Positioning **/

	trees: [
		[300, -125],
		[300, 115],
		[100, -20],
		[100, 10],
		[50, -30],
		[70, 0],
		[50, 30],
		[-15, 0],
	],

	/** Debug Settings **/
	wireframe: false,
	fps: true,

	/** Constructor **/

	init: function() {
		// check for WebGL
		if ( ! Detector.webgl ) {
			Detector.addGetWebGLMessage();
		}

		// Detect stereo request
		this.stereo = ( window.location.hash != '#desktop' );

	},
};

RPYeti.config.init();
