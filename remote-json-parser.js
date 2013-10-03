var request = require('request'),
	fs = require('fs'),
	readline = require('readline');

/**
	Data Loading
	============
	
	Loads the data to migrate from .json files on a remote server
*/

var dataServer 	= '[server]',
	dataPath 	= '[foler page]',
	dataKeyMap 	= {
		'[key]': 	'[filename]'
	};

exports.loadData = function(key, callback) {
	
	var path = dataServer + '/' + dataPath + '/' + dataKeyMap[key];
	var cacheFile = false; // cache the file locally for use
	var logErrorsToFile = true;
	
	if (!(key in dataKeyMap)) {
		throw new Error('Invalid data key provided (' + key + ').')
	}
	
	// if the file exists locally to use it, otherwise get it from remote.
	fs.exists(dataKeyMap[key], function(exists) {
		if (exists) {
			return readDataFile();
		} else {
			request(path).on('end', function() {
					return readDataFile();
			}).pipe(fs.createWriteStream(dataKeyMap[key]));		
		}
	});
	
	var readDataFile = function() {
		var rd = readline.createInterface({
			input: fs.createReadStream(dataKeyMap[key]),
			output: process.stdout,
			terminal: false
		});

		rd.on('line', function(line) {
			// console.log(line);
			try {
				var obj = JSON.parse(line.toString()); // parse the JSON	
				callback(obj);
			}
			catch(e){
				console.log("------------------------------");
				console.log("ERROR PROCESSING JSON:");
				console.log("------------------------------");
				// log errors to console
				console.log(e);
				console.log(line.toString());
				
				// log error to file
				if (logErrorsToFile) 
					logErrorToFile(line.toString());
				
				console.log("------------------------------");
			}
			
		}).on('close', function() {
			if (!cacheFile) {
				// if we are not caching the file - delete it
				fs.unlink(dataKeyMap[key], function(err) {
					return callback();
				});
			} else {
				return callback();
			}
		});
	}
	
	// Log errors to file
	var logErrorToFile = function(data) {
		
		var logFile = 'errors.log';
		
		// Check the error log exists
		fs.exists(logFile, function(exists) {
			if (!exists) {
				
				// if the file doesn't - create it
				fs.writeFile(logFile, data, function (err) {
					if (err) { console.log('Unable to create log file'); }
					return;
				});
			} else {
				
				// if it does - append to it
				fs.appendFile(logFile, '\n' + data, function (err) {
					if (err) { console.log('Unable to appended error to file!'); }
					return;
				});	
			}
		});
	}
}