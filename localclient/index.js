var config 		= require('config'),
	osc 		= require('node-osc'),
	oscClient 	= new osc.Client(config.tree.address, config.tree.port),
	net 		= require('net'),
	tcpClient	= net.connect(config.snowball, function () {
		console.log('Connected to Snowball.');		//an homage to RPTree 1.0.  Long Live Snowball.
	});

	//For now, whenever we recieve data, start the sequencer
	tcpClient.on('data', function () {
		oscClient.send('/sequencer/start 1');
		oscClient.send('/menorah/flash');
		setTimeout(function () {
			oscClient.send('/menorah/reset');
		}, 1000);
	});

	tcpClient.on('end', function() {
	  console.log('Disconnected from Snowball.');
	});



