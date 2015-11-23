var RPYeti = RPYeti || {};

RPYeti.loader = (function() {
	var self;

	return {

		loading: 0,
		loaded: 0,

		assets: [],

		textures: {},
		models: {},
		sounds: {},

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
			this.publisher.on('rpyeti.loader.asset', this.onAssetLoaded.bind( this) )

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
				self.publisher.trigger( 'rpyeti.loader.asset' );
			});
		},

		loadModel: function( asset ) {
			self.loading++;
			var model = asset,
				loader = new THREE.OBJMTLLoader();

			loader.load('../models/' + model.mesh, '../textures/' + model.skin, function(object) {
				self.models[ model.name ] = object;
				self.loaded++;
				self.publisher.trigger( 'rpyeti.loader.asset' );
			});
		},

		loadSound: function( asset ) {

			//TODO: audio loading

		},

		onAssetLoaded: function() {
			if( self.loaded === self.loading ) {
				this.publisher.trigger( 'rpyeti.loader.complete' );
			}
		}

	};

})();

$(function() {

	RPYeti.loader.init();

});
