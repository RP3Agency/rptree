var RPYeti = RPYeti || {};

RPYeti.loader = (function() {
	var self;

	// throw-away audio context for preloading
	var audio = new THREE.AudioListener();

	return {

		loading: 0,
		loaded: 0,

		assets: [],

		maps: {},
		textures: {},
		models: {},
		sounds: {},
		fonts: {},

		init: function() {
			// save singleton context
			self = this;

			// save global event publisher (document)
			this.publisher = $(document);

			// if config is not loaded, wait for load event
			if( ! RPYeti.config ) {
				this.publisher.on('rpyeti.config.loaded', this.init.bind( this ) );
				return;
			}

			// set listener for asset loaded event
			this.publisher.on('rpyeti.loader.progress', this.onProgress.bind( this) )

			// step through configured assets and start loading
			this.assets = RPYeti.config.assets;

			for( var i = 0; i < this.assets.length; i++ ) {
				self[ 'load' + this.assets[ i ].type ]( this.assets[ i ] );
			}
		},

		loadTexture: function( asset ) {
			self.loading++;
			var texture = asset,
				loader = new THREE.TextureLoader();

			loader.load('../textures/' + texture.file, function(object) {
				self.textures[ texture.name ] = object;
				self.loaded++;
				self.publisher.trigger( 'rpyeti.loader.progress' );
			});
		},

		loadModel: function( asset ) {
			self.loading++;
			var model = asset,
				loader = new THREE.OBJMTLLoader();

			loader.load('../models/' + model.mesh, '../textures/' + model.skin, function(object) {
				object.traverse(function(child) {
					if( child instanceof THREE.Mesh ) {
						child.castShadow = true;
						child.receiveShadow = true;
						child.material.side = THREE.DoubleSide;
						if( child.material.map && model.name.match(/yeti.*/)) {
							child.material.map.anisotropy = RPYeti.config.maxAnisotropy;
							child.material.map.minFilter = THREE.NearestFilter;
						}
					}
				});
				self.models[ model.name ] = object;
				self.loaded++;
				self.publisher.trigger( 'rpyeti.loader.progress' );
			});
		},

		loadSound: function( asset ) {
			self.loading++;
			var sound = asset,
				buffer = new THREE.AudioBuffer( audio.context );
			buffer.load( '../sounds/' + sound.file );
			buffer.onReady(function() {
				self.sounds[ sound.name ] = buffer;
				self.loaded++;
				self.publisher.trigger( 'rpyeti.loader.progress' );
			});
		},

		loadMap: function ( asset ) {
			self.loading++;
			var map = asset,
				loader = new THREE.JSONLoader();

			jQuery.getJSON('../maps/' + map.file, function (object) {
				object.density = map.density;
				self.maps[ map.name ] = object;
				self.loaded++;
				self.publisher.trigger( 'rpyeti.loader.progress' );
			});
		},

		loadFont: function( asset ) {
			self.loading++;
			var font = asset,
				loader = new Font();
			loader.src = '../fonts/' + asset.file;
			loader.onload = function() {
				self.fonts[ font.name ] = loader;
  				self.loaded++;
				self.publisher.trigger( 'rpyeti.loader.progress' );
			}
		},

		onProgress: function() {
			if( self.loaded === self.loading ) {
				this.publisher.trigger( 'rpyeti.loader.complete' );
			}
		}

	};

})();

$(function() {

	RPYeti.loader.init();

});
