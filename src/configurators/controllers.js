var path = require('path'),
	fs = require('fs');

module.exports = function(container) {
	var root = path.join(container.resolveSync('AppRoot'), 'controllers');

	fs.readdirSync(root).forEach(function(file) {
		container.registerType(require(path.join(root, file)));
	});
};