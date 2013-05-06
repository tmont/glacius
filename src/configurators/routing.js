module.exports = function(container) {
	var app = container.resolveSync('App');

	app.get('/', { controller: 'home' });
	app.get('/static/:action/:fileName', { controller: 'static' });
};