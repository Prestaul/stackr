function slice(arr) {
	return Array.prototype.slice.call(arr);
}

var stackr = module.exports = function() {
	var core = stackr.substack.apply(stackr, arguments);

	function entry(req, res) {
		core(req, res, function(err) {
			entry.handleError(req, res, err);
		});
	}
	entry.use = core.use;
	entry.handleError = stackr.handleError;

	return entry;
};

stackr.substack = function() {
	var middleware = [];

	function entry(req, res, done) {
		var i = 0, len = middleware.length;

		function next(err) {
			try {
				if(err) return done(err);

				middleware[i++](req, res, i < len ? next : done);
			} catch(e) {
				done(e);
			}
		}

		if(len)
			next();
		else
			done();
	}

	entry.use = function(first) {
		middleware = middleware.concat(first instanceof Array ? first : slice(arguments));
		return this;
	};

	entry.use.apply(entry, arguments);

	return entry;
};

stackr.handleError = function(req, res, err) {
	if(err) {
		console.error(err.stackr || err);
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end((err.stackr || err) + '\n');
	} else {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end('Not Found\n');
	}
};
