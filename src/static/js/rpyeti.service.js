var RPYeti = RPYeti || {};

RPYeti.service = (function() {
	var self;

	return {
		uuid: null,

		init: function() {
			// save singleton context
			self = this;

			//TODO: get cookie values if setup

			//TODO: if no cookie, generate UUID and set cookie
			if( ! this.uuid ) {
				this.uuid = this.generateUUID();
				//this.saveCookie();
			}

			//TODO: placeholder to connect to game service (leaderboards, choices, analytics, etc)

			//TODO: add listeners to catch game events and report to server

		},

		// create RFC4122 Version 4 compliant random UUID
		generateUUID: function() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    			var r = crypto.getRandomValues( new Uint8Array(1) )[0] % 16 | 0,
				 	v = ( c == 'x' ) ? r : ( r & 0x3 | 0x8 );
    			return v.toString(16);
			});
		}

	};

})();

$(function() {

	RPYeti.service.init();

});
