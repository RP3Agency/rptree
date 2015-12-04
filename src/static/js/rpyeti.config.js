var RPYeti = RPYeti || {};

RPYeti.config = {

	/** Default Settings **/

	stereo: false,
	cardboard: {
		fov: 75,
		focalLength: 250,
		eyeSeparation: 1,
		pupillaryBaseline: 750
	},
	desktop: {
		fov: 55,
	},

	/** Game Mechanics **/

	snowball: {
		size: 1,
		lod: 8,
		speed: 70,
		range: 250,
		rate: 200,
		damage: 5,
	},

	player: {
		hitbox: 5,
		health: 100,
	},

	/** Model Positioning **/

	mounds: [],

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
		minX: 150,
		maxX: -150,
		minZ: 150,
		maxZ: -150,
		yeti: {
			appearEasing: TWEEN.Easing.Circular.In,
			appearDuration: 1500,
			disappearEasing: TWEEN.Easing.Circular.Out,
			disappearDuration: 500,
			defeatEasing: TWEEN.Easing.Bounce.Out,
			defeatDuration: 2000
		}
	},

	gameplay: {
		baseline: {
			popTimer: {
				min: 5000,
				max: 10000
			},
			yeti: {
				appearDelay: {
					min: 3000,
					max: 5000
				},
				throwCount: {
					min: 1,
					max: 2
				},
				throwDelay: {
					min: 4000,
					max: 6000
				},
				health: 5,
				points: 1,
				total: 10,
				maxOnScreen: 3,
			}
		},

		modifiers: {
			popTimer: {
				min: function (level) { return -(level * 80); },
				max: function (level) { return -(level * 60); }
			},
			yeti: {
				appearDelay: {
					min: function (level) { return -(level * 15); },
					max: function (level) { return -(level * 5); }
				},
				throwCount: {
					min: function (level) { return Math.floor(level * 0.05); },
					max: function (level) { return Math.floor(level * 0.1); }
				},
				throwDelay: {
					min: function (level) { return -(level * 40); },
					max: function (level) { return -(level * 20); }
				},
				health: function (level) { return Math.floor(level * 0.30); },
				total: function (level) { return Math.floor(level * 0.45); },
				maxOnScreen: function (level) { return Math.floor(level * .08); },
			}
		}
	},

	/** Game Assets **/

	assets: [
		// maps
		{ type: 'Map', name: 'main', density: 16, file: 'main.json' },

		// textures
		{ type: 'Texture', name: 'snow', file: 'patterns/snow-tile.jpg' },
		{ type: 'Texture', name: 'snowmound', file: 'patterns/snow-tile.jpg' },
		{ type: 'Texture', name: 'stars', file: 'patterns/starfield.png' },
		{ type: 'Texture', name: 'snowball', file: 'patterns/snow-ground.jpg' },

		// models
		{ type: 'Model', name: 'tree', mesh: 'tree.obj', skin: 'tree.mtl' },
		{ type: 'Model', name: 'snowytree', mesh: 'tree-snow.obj', skin: 'tree-snow.mtl' },
		{ type: 'Model', name: 'rock', mesh: 'rock1.obj', skin: 'rock1.mtl' },
		{ type: 'Model', name: 'snowyrock', mesh: 'rock1snow.obj', skin: 'rock1snow.mtl' },
		{ type: 'Model', name: 'log', mesh: 'log.obj', skin: 'log.mtl' },
		{ type: 'Model', name: 'sign', mesh: 'sign.obj', skin: 'sign.mtl' },
		{ type: 'Model', name: 'ground', mesh: 'ground.obj', skin: 'ground.mtl' },
		{ type: 'Model', name: 'mound', mesh: 'mound.obj', skin: 'mound.mtl' },
		{ type: 'Model', name: 'yeti', mesh: 'yeti.obj', skin: 'yeti.mtl' },
		{ type: 'Model', name: 'yeti_prethrow', mesh: 'yeti-prethrow.obj', skin: 'yeti-prethrow.mtl' },
		{ type: 'Model', name: 'yeti_throw', mesh: 'yeti-throw.obj', skin: 'yeti-throw.mtl' },

		// sounds
		{ type: 'Sound', name: 'throw', file: 'throw.wav' },
		{ type: 'Sound', name: 'roar', file: 'roar.mp3' },
		{ type: 'Sound', name: 'oof', file: 'oof.mp3' },
		{ type: 'Sound', name: 'tink', file: 'tink.mp3' },      // placeholder
		{ type: 'Sound', name: 'whack', file: 'whack.mp3' },	// Rock Hit
		{ type: 'Sound', name: 'splat', file: 'splat.mp3' },	// placeholder
		{ type: 'Sound', name: 'thump', file: 'thump.mp3' },	// Tree Hit
		{ type: 'Sound', name: 'smack', file: 'smack.mp3' },	// placeholder

		// fonts
		{ type: 'Font', name: 'GameFont', file: '8bit.ttf' },
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

		// Detect max anisotropy
		var renderer = new THREE.WebGLRenderer();
		this.maxAnisotropy = renderer.getMaxAnisotropy();

	},
};

RPYeti.config.init();
