var goa = require('goa');

function HomeController() {

}

HomeController.prototype = {
	index: function(params, send) {
		send(goa.view('home/index'));
	}
};

module.exports = HomeController;