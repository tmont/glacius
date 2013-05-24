var lifetime = require('sahara').lifetime,
	mysql = require('mysql'),
	redis = require('redis');

module.exports = function(container) {
	var key = 'DbConnection',
		manager = container.resolveSync('ObjectManager');

	function createMariaConnection(container, callback) {
		var cfg = container.resolveSync('Config').db,
			log = container.resolveSync('Log'),
			conn = mysql.createConnection({
				host: cfg.host,
				user: cfg.user,
				password: cfg.password,
				port: cfg.port,
				database: cfg.database
			});

		conn.connect(function(err) {
			if (err) {
				log.error('Failed to connect to MariaDB', err);
				callback && callback(err);
				return;
			}

			log.debug('Connected to MariaDB using ' + cfg.user + '@' + cfg.host + ':' + cfg.port);
			callback && callback(null, conn);
		});

		conn.on('error', function(err) {
			if (!err.fatal || err.code !== 'PROTOCOL_CONNECTION_LOST') {
				log.warn('Non-fatal MariaDB error occurred', err);
				return;
			}

			log.error('MariaDB disconnected or crashed, attempting to reconnect');
			createMariaConnection(container, function(err, conn) {
				if (err) {
					log.error('Unable to reconnect to MariaDB');
					process.exit(1);
				}

				log.info('Reconnected to MariaDB');
				//re-register and override the factory-based registration
				container.registerInstance(conn, key, lifetime.external(manager));
			});
		});

		if (callback) {
			callback(null, conn);
		} else {
			return conn;
		}
	}

	function createRedisClient(container, callback) {
		var cfg = container.resolveSync('Config').redis,
			log = container.resolveSync('Log');

		var redisClient = redis.createClient(cfg.port, cfg.host);
		redisClient.on('error', function(err) {
			log.error('Redis error', err);
		});
		if (log.isDebugEnabled()) {
			redisClient.on('connect', function() {
				log.debug('Connected to redis on ' + cfg.host + ':' + cfg.port);
			});
			redisClient.on('end', function() {
				log.debug('Disconnected from redis on ' + cfg.host + ':' + cfg.port);
			});
		}

		if (callback) {
			callback(null, redisClient);
			return;
		}

		return redisClient;
	}



	container
		.registerFactory(createRedisClient, 'RedisClient', lifetime.memory())
		.registerFactory(createMariaConnection, key, lifetime.external(manager));
};