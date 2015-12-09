#!/usr/bin/env node

var parser = require('nomnom');

app = module.exports;
app.config = require('config');

var defaultFile = './out.json',
	processorOpts = {

	};

global.csv = require('csv');
global.fs = require('fs');
global.path = require('path');

parser.script('parser')
	.options({
		file: {
			position: 0,
			help: 'CSV File to Process',
			required: true,
		},
		out: {
			abbr: 'o',
			metavar: 'out',
			help: 'Rendering Output Path',
			callback: function (p) {
				try {
					fs.statSync(p);
				} catch (e) {
					console.log(e);
					process.exit();
				}
			}
		},
	});

function offset(arr, xoff, yoff) {
	for (var i = 0; i < arr.length; i++) {
		arr[i][0] += xoff;
		arr[i][1] += yoff;
	}
}

function flip(arr, axis) {
	for (var i = 0; i < arr.length; i++) {
		arr[i][axis] = -(arr[i][axis]);
	}
}

(function (opts) {

	var outFile = (opts.out || defaultFile),
		inputStream = fs.createReadStream(opts.file),
		parser = csv.parse(processorOpts);

	console.log('Parsing...');

	var trees = [],
		strees = [],
		srocks = [],
		rocks = [],
		mounds = [],
		logs = [],
		signs = [],
		intro = [],
		row = 0,
		cols = 0;

	parser.on('readable', function () {
		while (record = parser.read()) {
			for (var i in record) {
				col = parseInt(i);

				if (col > cols) {
					cols = col;
				}

				(function (x, y) {
					var coords = [x, y];
					switch (parseInt(record[i])) {
						case 1:
							srocks.push(coords);
							break;
						case 2:
							strees.push(coords);
							break;
						case 3:
							rocks.push(coords);
							break;
						case 4:
							mounds.push(coords);
							break;
						case 5:
							trees.push(coords);
							break;
						case 6:
							logs.push(coords);
							break;
						case 7:
							signs.push(coords);
							break;
						case 8:
							intro.push(coords);
					}
				})(row, col);
			}

			row++;
		}

		//console.log(trees);
	});

	parser.on('error', function (error) {
		console.log('Error: ' + error);
	});

	parser.on('end', function() {
		var xoff = -(Math.floor(cols / 2)),
			yoff = -(Math.floor(row / 2));

		offset(strees, xoff, yoff);
		offset(srocks, xoff, yoff);
		offset(rocks, xoff, yoff);
		offset(mounds, xoff, yoff);
		offset(trees, xoff, yoff);
		offset(logs, xoff, yoff);
		offset(signs, xoff, yoff);
		offset(intro, xoff, yoff);

		flip(strees, 0);
		flip(srocks, 0);
		flip(rocks, 0);
		flip(mounds, 0);
		flip(trees, 0);
		flip(logs, 0);
		flip(signs, 0);
		flip(intro, 0);

		var obj = {
			strees: strees,
			trees: trees,
			srocks: srocks,
			rocks: rocks,
			mounds: mounds,
			logs: logs,
			signs: signs,
			intro: intro
		}

		fs.writeFile(outFile, JSON.stringify(obj));
	});

	inputStream.pipe(parser);

})(parser.parse());
