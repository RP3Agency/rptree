var config 		= require('config'),
	osc 		= require('node-osc'),
	oscClient 	= new osc.Client(config.tree.address, config.tree.port),
	net 		= require('net'),
	tcpClient	= net.connect(config.snowball, function () {
		console.log('Connected to Snowball.');		//an homage to RPTree 1.0.  Long Live Snowball.
	});

//For now, whenever we recieve data, start the sequencer
tcpClient.on('data', function (data) {
	console.log('Incoming: ', data.toString());

	console.log('Throwing Snowball at Tree.');
	oscClient.send('/sequencer/start 1');

	console.log('Throwing Snowball at Menorah.');
	oscClient.send('/menorah/flash');

	setTimeout(function () {
		console.log('Relighting Menorah.');
		oscClient.send('/menorah/reset');
	}, 1500);
});

tcpClient.on('end', function() {
	console.log('Disconnected from Snowball.');
});

tcpClient.on('error', function(err) {
	console.log('Snowball error! ', err);
});


// Keep tabs on the menorah
var updateHour = 16,
	updateMinute = 47,
	start = new Date(2014, 12, 16, updateHour, updateMinute),
	lastUpdate = new Date(),
	checkInterval = 60000,


setInterval(function () {
	console.log('Checking date...');

	var now = new Date();
	if (lastUpdate.getDate() > now.date() && now.getHours() >= updateHour && now.getMiunutes() >= updateMinute) {
		console.log('Updating!');

		oscClient.send('/menorah/inc');

		lastUpdate = now;
	}

}, checkInterval);
