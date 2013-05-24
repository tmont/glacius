var less = require('less'),
	path = require('path'),
	fs = require('fs'),
	goa = require('goa');

function StaticController(/** AppRoot */root) {
	this.root = root;
}

StaticController.prototype = {
	css: function(params, send) {
		var fileName = path.join(this.root, 'static', 'css', params.fileName).replace(/\.css$/, '.less'),
			self = this;
		fs.readFile(fileName, 'utf8', function(err, contents) {
			if (err) {
				send(goa.error(err, 404));
				return;
			}

			less.render(contents, { paths: [ path.join(self.root, 'static', 'css') ] }, function(err, css) {
				if (err) {
					send(goa.error(err));
					return;
				}

				send(goa.action(css, 'text/css'));
			});
		});
	},

	js: function(params, send) {
		send(goa.file(path.join(this.root, 'static', 'js', params.fileName)));
	},

	images: function(params, send) {
		send(goa.file(path.join(this.root, 'static', 'images', params.fileName)));
	}
};

module.exports = StaticController;

