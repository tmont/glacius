var cluster = require('cluster'),
	util = require('util');

function Logger(logger, options) {
	options = options || {};

	this.showPid = !!options.showPid;
	this.logger = logger;

	this.logger.on('error', function(err) {
		console.error('Error while logging', err);
	});
}

Logger.levels = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3
};

Logger.colors = {
	debug: 'grey',
	info: 'green',
	warn: 'yellow',
	error: 'red'
};

function log(level) {
	return function() {
		var message = Array.prototype.slice.call(arguments).map(function(arg) {
			if (typeof(arg) === 'object') {
				var message = util.inspect(arg, false, 5, true);
				if (arg && arg.stack) {
					message += '\n' + arg.stack;
				}
				return message;
			}

			return (arg || '').toString();
		}).join(' ');

		var pid = '';
		if (this.showPid) {
			pid = '[' + (cluster.isMaster ? 'master' : cluster.worker.process.pid) + '] ';
		}

		this.logger.log(level, pid + message);
	};
}

Logger.prototype = {
	isDebugEnabled: function() {
		return this.logger.level === 'debug';
	},
	debug: log('debug'),
	info: log('info'),
	warn: log('warn'),
	error: log('error'),
	middleware: function(req, res, next) {
		var signature = req.method + ' ' + req.url + ' HTTP/' + req.httpVersion,
			start = Date.now(),
			log = this;

		res.on('finish', function() {
			var elapsed = (Date.now() - start);
			if (elapsed >= 500) {
				elapsed = '\x1B[31m' + elapsed + 'ms\x1B[39m';
			} else if (elapsed >= 250) {
				elapsed = '\x1B[35m' + elapsed + 'ms\x1B[39m';
			} else if (elapsed >= 100) {
				elapsed = '\x1B[36m' + elapsed + 'ms\x1B[39m';
			} else {
				elapsed += 'ms';
			}

			var status = res.statusCode;
			if (status < 300) {
				status = '\x1B[32m' + status + '\x1B[39m';
			} else if (status < 400) {
				status = '\x1B[33m' + status + '\x1B[39m';
			} else {
				status = '\x1B[31m' + status + '\x1B[39m';
			}

			log.debug([ elapsed, status, signature ].join(' '));
		});
		next();
	}
};

module.exports = Logger;