process.on('uncaughtException', function(err) {
	(log || console).error('Uncaught exception', err);
	process.exit(1);
});

process.on('SIGTERM', function() {
	var message = 'Received SIGTERM, exiting';
	//TODO handle SQL transactions
	if (log) {
		log.warn(message);
	} else {
		console.log(message);
	}
	process.exit(0);
});

var cluster = require('cluster'),
	config = require('./config'),
	winston = require('winston'),
	Logger = require('./logger'),
	winstonConfig = {
		level: config.log.level,
		levels: Logger.levels,
		transports: [
			new winston.transports.Console({
				timestamp: config.log.timestamps === 'verbose' ? true : function() {
					var date = new Date(),
						ms = date.getMilliseconds().toString();
					ms = ms + new Array((3 - ms.length + 1)).join('0');
					return [ date.getHours(), date.getMinutes(), date.getSeconds() ]
						.map(function(value) {
							return value < 10 ? '0' + value : value;
						})
						.join(':') + '.' + ms;
				},
				level: config.log.level,
				colorize: true
			})
		]
	},

	log = new Logger(new winston.Logger(winstonConfig));


function initMaster() {
	var numWorkers = require('os').cpus().length;
	for (var i = 0; i < numWorkers; i++) {
		cluster.fork();
	}

	if (log.isDebugEnabled()) {
		cluster.on('online', function(worker) {
			log.debug('worker ' + worker.process.pid + ' is online');
		});

		cluster.on('disconnect', function(worker) {
			log.debug('worker ' + worker.process.pid + ' has disconnected');
		});
	}

	cluster.on('exit', function(worker) {
		var causeOfDeath = worker.suicide ? 'suicide' : 'murder';
		log.error('worker ' + worker.process.pid + ' died via ' + causeOfDeath);
		cluster.fork();
	});

	log.info('Master process initialized');
}

function initWorker() {
	var sahara = require('sahara'),
		container = new sahara.Container()
			.registerInstance(log, 'Log', sahara.lifetime.memory())
			.registerInstance(__dirname, 'AppRoot', sahara.lifetime.memory())
			.registerInstance(config, 'Config', sahara.lifetime.memory());

	var configurators = [ 'db', 'controllers', 'web', 'routing' ];

	configurators.forEach(function(name) {
		require('./configurators/' + name)(container);
	});

	container.resolveSync('App').listen(config.listenPort);
	log.info('Listening on port ' + config.listenPort);
}

if (cluster.isMaster) {
	initMaster();
} else {
	initWorker();
}
