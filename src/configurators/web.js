var lifetime = require('sahara').lifetime,
	path = require('path'),
	goa = require('goa');

module.exports = function(container) {
	//set up Goa, using the container to resolve controllers
	var app = goa(function(name, context, callback) {
		var className = name.charAt(0).toUpperCase() + name.substring(1) + 'Controller';
		container.resolve(className, function(err, controller) {
			if (err) {
				callback(err);
				return;
			}

			callback(null, controller);
		});
	});

	var config = container.resolveSync('Config'),
		log = container.resolveSync('Log'),
		root = container.resolveSync('AppRoot'),
		RedisStore = require('connect-redis')(app.express);

	app.enable('trust proxy');
	app.enable('strict routing');
	app.enable('case sensitive routing');
	if (!config.cacheViews) {
		app.disable('view cache');
	}
	app.set('views', path.join(root, 'views'));
	app.set('view engine', 'jade');

	//expose some locals for use in templates
	app.locals.pretty = true;
//	app.locals.url = routes._locals.url;
	app.locals.config = {
		host: config.host,
		staticBasePath: config.staticBasePath,
		scheme: config.scheme
	};

	if (log.isDebugEnabled()) {
		app.use(log.middleware.bind(log));
	}

	//set up express middleware
	app.use(app.express.methodOverride());
	app.use(app.express.cookieParser());
	app.use(app.express.bodyParser());
	app.use(app.express.session({
		secret: config.session.secret,
		proxy: true,
		store: new RedisStore({
			client: container.resolveSync('RedisClient')
		})
	}));

	//shove the request and response into the container so we can
	//use them elsewhere via the container
	app.use(function(req, res, next) {
		container
			.registerInstance({ req: req, res: res }, 'ControllerContext', lifetime.memory())
			.registerInstance(req, 'Request', lifetime.memory())
			.registerInstance(res, 'Response', lifetime.memory());

		next();
	});

	//shove the request and response into the container so we can
	//use them elsewhere via the container
	app.use(function(req, res, next) {
		container
			.registerInstance({ req: req, res: res }, 'ControllerContext', lifetime.memory())
			.registerInstance(req, 'Request', lifetime.memory())
			.registerInstance(res, 'Response', lifetime.memory());

		next();
	});

	//set up some convenience variables
	app.use(function(req, res, next) {
		app.locals.req = req;
		req.isAuthenticated = !!(req.session && req.session.user && req.session.user.id);
		next();
	});

	app.use(app.router);

	app.use(function(err, req, res, next) {
		if (!err.status) {
			log.error(err);
		}

		//only set status code if it hasn't already been set
		if (res.statusCode === 200) {
			res.status(err.status || 500);
		}

		switch (res.get('Content-Type')) {
			case 'application/json':
				res.send({ message: err.clientMessage || '' });
				break;
			default:
				res.render((res.statusCode === 404 ? '404' : '500'));
				break;
		}
	});

	container.registerInstance(app, 'App', lifetime.memory());
};