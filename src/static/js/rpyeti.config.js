var RPYeti = RPYeti || {};

RPYeti.config = {

	/** Default Settings **/

	stereo: false,
	cardboard: {
		fov: 95,
		focalLength: 250,
		eyeSeparation: 1,
		pupillaryBaseline: 750
	},
	desktop: {
		fov: 65,
	},

	camera: {
		height: 10,
		yaw: ( - Math.PI / 2 ),
	},

	controls: {
		keys: {
			MOVEUP:		[ 38, 87, ],		// up-arrow, W
			MOVEDOWN:	[ 40, 83, ],		// down-arrow, S
			MOVELEFT:	[ 37, 65, ],		// left-arrow, A
			MOVERIGHT:	[ 39, 68, ],		// right-arrow, D
			HALFSPEED:	[ 16, ],			// shift
			FIRE:		[ 32, 13, 14, ],	// spacebar, return, enter
		},
		codes: {
			KONAMI:		[ 38, 38, 40, 40, 37, 39, 37, 39, 66, 65 ],
			STARFOXZ:	[ 90, 90 ],
			STARFOXR:	[ 82, 82 ],
		},
		keySpeed: {
			x: 1.1,
			y: 1.8,
		},
		mouseSpeed: 0.002,
	},

	urls: {
		leaderBoard: '../leaderboard.html'
	},

	text: {
		hud: {
			gameOver: 'GAME OVER',
			gameOverVR: 'GAME OVER\nPlease remove device',
			exclamation: 'Oh no...\nYeti!',
			yetiDowned: 'Yeti Down!',
			yetiOnYeti: 'Yeti Crossfire!',
			remaining: 'to go',
			thankYou: 'Thank you for\nyour support!'
		},
		dialog: {
			introSeque: [
				'Throw snowballs to hit\nYetis before they hit you.\n\nThe more you hit,\nthe higher your score.'
			],
			desktopHelp: [
				'The first snowball you\nthrow determines where\nyour donation goes.\n\nDouble-click to start.\nUse your mouse\nto aim at a logo.\nClick to fire away.'
			],
			vrHelp: [
				'The first snowball you\nthrow determines where\nyour donation goes.\n\nMove viewer to aim at\na logo. Press top right\ntrigger to fire away.',
			]
		}
	},

	audio: {
		musicVolume: 0.03,
		effectVolume: 1.5,
		pointblankVolume: 0.2,
		effectRolloff: 0.25,
	},

	/** Game Mechanics **/

	terrain: {
		depth: 500
	},

	snowball: {
		size: 1,
		lod: 8,
		speed: 70,
		range: 250,
		rate: 200,
		damage: 5,
	},

	player: {
		hitbox: 6,
		health: 100,
		lowHealth: 35
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
		borderColor: 'rgba(0,0,0,0.25)',
		baseColor: 'rgba(255,222,0,0.75)',
		damageColor: 'rgba(255,0,0,1)',
		textPos: -350,
		textSize: 40,
		textStyle: 'rgba(255,77,148,1)',
		textFont: 'PressStart2P',
	},

	dialog: {
		canvasWidth: 1024,
		canvasHeight: 1024,
		focalPoint: 0.05,
		lineWidth: 10,
		borderColor: 'rgba(192,192,192,0.75)',
		baseColor: 'rgba(255,255,255,0.8)',
		topStereoOffset: 50,
		innerPadding: 30,
		outerPadding: 5,
		textSize: 65,
		textStyle: 'rgba(51,51,51,1)',
		textFont: 'Verdana',
		textShadowColor: 'transparent',
		textShadowOffsetX: 1,
		textShadowOffsetY: 1,
		textShadowBlur: 1,
		textLineSpacing: 1
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
				min: 2000,
				max: 7500
			},
			yeti: {
				appearDelay: {
					min: 3000,
					max: 7000
				},
				throwCount: {
					min: 1,
					max: 2
				},
				throwDelay: {
					min: 1500,
					max: 3000
				},
				health: 5,
				points: 1,
				total: 10,
				maxOnScreen: 2,
			}
		},

		modifiers: {
			popTimer: {
				min: function (level) { return -(level * 150); },
				max: function (level) { return -(level * 65); }
			},
			yeti: {
				appearDelay: {
					min: function (level) { return -(level * 150); },
					max: function (level) { return -(level * 25); }
				},
				throwCount: {
					min: function (level) { return Math.floor(level * 0.01); },
					max: function (level) { return Math.floor(level * 0.15); }
				},
				throwDelay: {
					min: function (level) { return -(level * 45); },
					max: function (level) { return -(level * 30); }
				},
				health: function (level) { return Math.floor(level * 0.5); },
				total: function (level) { return Math.floor(level * 0.45); },
				maxOnScreen: function (level) { return Math.floor(level * .2); },
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
		{ type: 'Texture', name: 'stars', file: 'patterns/starfield.jpg' },
		{ type: 'Texture', name: 'snowball', file: 'patterns/snow-ground.jpg' },
		{ type: 'Texture', name: 'snowburst', file: 'patterns/pixel-snow.jpg' },

		// models
		{ type: 'Model', name: 'tree', mesh: 'tree.obj', skin: 'tree.mtl' },
		{ type: 'Model', name: 'snowytree', mesh: 'tree-snow.obj', skin: 'tree-snow.mtl' },
		{ type: 'Model', name: 'decoratedtree', mesh: 'decoratedtree.obj', skin: 'decoratedtree.mtl' },
		{ type: 'Model', name: 'rock', mesh: 'rock1.obj', skin: 'rock1.mtl' },
		{ type: 'Model', name: 'snowyrock', mesh: 'rock1snow.obj', skin: 'rock1snow.mtl' },
		{ type: 'Model', name: 'log', mesh: 'log.obj', skin: 'log.mtl' },
		{ type: 'Model', name: 'sign', mesh: 'sign.obj', skin: 'sign.mtl' },
		{ type: 'Model', name: 'sign_cn', mesh: 'sign-cn.obj', skin: 'sign-cn.mtl' },
		{ type: 'Model', name: 'sign_ja', mesh: 'sign-ja.obj', skin: 'sign-ja.mtl' },
		{ type: 'Model', name: 'sign_wawf', mesh: 'sign-wawf.obj', skin: 'sign-wawf.mtl' },
		{ type: 'Model', name: 'ground', mesh: 'ground.obj', skin: 'ground.mtl' },
		{ type: 'Model', name: 'mound', mesh: 'mound.obj', skin: 'mound.mtl' },
		{ type: 'Model', name: 'yeti', mesh: 'yeti.obj', skin: 'yeti.mtl' },
		{ type: 'Model', name: 'yeti_prethrow', mesh: 'yeti-prethrow.obj', skin: 'yeti-prethrow.mtl' },
		{ type: 'Model', name: 'yeti_throw', mesh: 'yeti-throw.obj', skin: 'yeti-throw.mtl' },

		// sounds
		{ type: 'Sound', name: 'player_throw', file: 'throw.mp3' },
		{ type: 'Sound', name: 'yeti_roar', file: 'roar.mp3' },
		{ type: 'Sound', name: 'yeti_hit', file: 'oof.mp3' },
		{ type: 'Sound', name: 'rock_hit', file: 'whack.mp3' },
		{ type: 'Sound', name: 'tree_hit', file: 'thump.mp3' },
		{ type: 'Sound', name: 'snow_hit', file: 'tink.mp3' },
		{ type: 'Sound', name: 'player_hit', file: 'smack.mp3' },

		// game music
		{ type: 'Sound', name: 'music_bells', file: 'music-tree-selection.mp3' },
		{ type: 'Sound', name: 'music_tree_selection', file: 'music-tree-selection.mp3' },
		{ type: 'Sound', name: 'music_tree_theft', file: 'music-tree-theft.mp3' },
		{ type: 'Sound', name: 'music_snowball_fight', file: 'music-snowball-fight.mp3' },
		{ type: 'Sound', name: 'music_snowball_fight_low_health', file: 'music-snowball-fight-low-health.mp3' },
		{ type: 'Sound', name: 'music_level_lose', file: 'music-level-lose.mp3' },
		{ type: 'Sound', name: 'music_level_win', file: 'music-level-win.mp3' },
	],

	/** Debug Settings **/
	debug: false,
	wireframe: false,
	fps: false,

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
