var path = require('path');

function isDotFile(basename) {
	return basename.charAt(0) === '.';
}
function isNotJsFile(basename, stat) {
	return !/\.js$/.test(basename) && stat.isFile();
}

module.exports = {
	locations: [
		{
			dir: __dirname,
			options: {
				type: 'watchFile',
				exclude: function(filename, stat) {
					if (filename === __filename) {
						return true;
					}

					var basename = path.basename(filename);
					return isDotFile(basename) ||
						(basename === 'static' && stat.isDirectory()) ||
						isNotJsFile(basename, stat);
				}
			}
		}
	],
	services: [
		'glacius'
	]
};