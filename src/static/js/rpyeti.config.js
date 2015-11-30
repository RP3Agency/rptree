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
		damage: 5,
	},

	player: {
		hitbox: 5,
		health: 100,
	},

	/** Model Positioning **/

	trees: [
		[ 300, -125 ],
		[ 300,  115 ],
		[ 100,  -20 ],
		[ 100,   10 ],
		[  50,  -30 ],
		[  70,  100 ],
		[  50,   30 ],
		[ -30,    0 ],
		[ 800,    0 ],
	],

	rocks: [
		[ 'rock',      60, -20 ],
		[ 'snowyrock', 80,  15 ],
		[ 'rock',       2, 100 ],
	],

	mounds: [
		[ 100,  -7 ],
		[  -2, -90 ],
		[ -30, -40 ],
		[   0,   0 ],
	],

	/** HUD configuration **/

	hud: {
		canvasWidth: 1024,
		canvasHeight: 1024,
		size: 20,
		easing: TWEEN.Easing.Quintic.Out,
		easeDuration: 200,
		innerFocalMax: 0.05,
		baseColor: 'rgba(0,174,239,0.50)',
		damageColor: 'rgba(255,0,0,1)',
		textPos: -350,
		textSize: 40,
		textStyle: 'rgba(0,174,239,1)'
	},

	character: {
		minX: 250,
		maxX: -250,
		minZ: 250,
		maxZ: -250,
		yeti: {
			appearEasing: TWEEN.Easing.Circular.In,
			appearDuration: 1500,
			disappearEasing: TWEEN.Easing.Circular.Out,
			disappearDuration: 500,
			defeatEasing: TWEEN.Easing.Bounce.Out,
			defeatDuration: 2000
		}
	},

	/** Game Assets **/

	assets: [
		// textures
		{ type: 'Texture', name: 'snow', file: 'patterns/snow-tile.jpg' },
		{ type: 'Texture', name: 'snowmound', file: 'patterns/snow-tile.jpg' },
		{ type: 'Texture', name: 'stars', file: 'patterns/starfield.png' },
		{ type: 'Texture', name: 'snowball', file: 'patterns/snow-ground.jpg' },

		// models
		{ type: 'Model', name: 'tree', mesh: 'tree-snow.obj', skin: 'tree-snow.mtl' },
		{ type: 'Model', name: 'rock', mesh: 'rock1.obj', skin: 'rock1.mtl' },
		{ type: 'Model', name: 'snowyrock', mesh: 'rock1snow.obj', skin: 'rock1snow.mtl' },
		{ type: 'Model', name: 'mound', mesh: 'mound.obj', skin: 'mound.mtl' },
		{ type: 'Model', name: 'yeti', mesh: 'yeti.obj', skin: 'yeti.mtl' },

		// sounds
		{ type: 'Sound', name: 'throw', file: 'throw.wav' },
		{ type: 'Sound', name: 'roar', file: 'roar.mp3' },
		{ type: 'Sound', name: 'oof', file: 'oof.mp3' },
		{ type: 'Sound', name: 'tink', file: 'tink.mp3' },      // placeholder
		{ type: 'Sound', name: 'whack', file: 'whack.mp3' },	// placeholder
		{ type: 'Sound', name: 'splat', file: 'splat.mp3' },	// placeholder
		{ type: 'Sound', name: 'thump', file: 'thump.mp3' },	// placeholder
		{ type: 'Sound', name: 'smack', file: 'smack.mp3' },	// placeholder
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
