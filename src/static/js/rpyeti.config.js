var RPYeti = RPYeti || {};

RPYeti.config = {

	/** Default Settings **/

	stereo: false,
	cardboard: {
		fov: 75,
		focalLength: 600,
		eyeSeparation: 1,
		pupillaryBaseline: 750
	},
	desktop: {
		fov: 45,
	},

	/** Game Mechanics **/

	snowball: {
		size: 1,
		lod: 8,
		speed: 70,
		range: 500,
		rate: 200,
	},

	/** Model Positioning **/

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

	hud: {
		canvasWidth: 1024,
		canvasHeight: 1024,
		size: 30,
		easing: TWEEN.Easing.Quintic.Out,
		easeDuration: 200,
		innerFocalMax: 0.05,
		baseColor: 'rgba(0,174,239,0.50)',
		damageColor: 'rgba(255,0,0,1)'
	},

	/** Game Assets **/

	assets: [

		{ type: 'Texture', name: 'snow', file: 'patterns/snow-tile.jpg' },
		{ type: 'Texture', name: 'stars', file: 'patterns/starfield.png' },
		{ type: 'Texture', name: 'snowball', file: 'patterns/snow-ground.jpg' },

		{ type: 'Model', name: 'tree', mesh: 'tree-snow.obj', skin: 'tree-snow.mtl' },

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
