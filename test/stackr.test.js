var assert = require('chai').assert,
	stackr = require('../index');

var RESPONSES = {
	404: {
		head: [404, { 'Content-Type': 'text/plain' }]
	},
	500: {
		head: [500, { 'Content-Type': 'text/plain' }]
	}
};

function A(req, res, next) {
	res.write('A');
	next();
}
function B(req, res, next) {
	res.write('B');
	next();
}
function C(req, res, next) {
	res.write('C');
	next();
}
function D(req, res, next) {
	res.write('D');
	next();
}
function E(req, res, next) {
	res.end('E');
}
function F1(req, res, next) {
	throw new Error('You get an "F".');
}
function F2(req, res, next) {
	next(new Error('You get an "F".'));
}

function newResponse() {
	return {
		head: null,
		body: [],
		closed: false,

		writeHead: function() {
			if(this.head) throw new Error('response.writeHead called twice');
			if(this.closed) throw new Error('response.writeHead called after response.end');

			this.head = Array.prototype.slice.call(arguments);
		},

		write: function(val) {
			if(this.closed) throw new Error('response.write called after response.end');

			this.body.push(val);
		},

		end: function(val) {
			this.body.push(val);
			this.closed = true;
		}
	};
}

function validateStack(stack) {
	var response = newResponse();

	stack({}, response);

	assert.isNull(response.head);
	assert.deepEqual(response.body, ['A', 'B', 'C', 'D', 'E']);
	assert.isTrue(response.closed);
}

describe('stackr', function() {

	it('should stack correctly from multiple constructor arguments', function() {
		var stack = stackr(A, B, C, D, E);
		validateStack(stack);
	});

	it('should stack correctly from array passed to constructor', function() {
		var stack = stackr([A, B, C, D, E]);
		validateStack(stack);
	});

	it('should stack correctly from multiple `use` arguments', function() {
		var stack = stackr().use(A, B, C, D, E);
		validateStack(stack);
	});

	it('should stack correctly from array passed to `use`', function() {
		var stack = stackr().use([A, B, C, D, E]);
		validateStack(stack);
	});

	it('should stack correctly from multiple `use` calls', function() {
		var stack = stackr().use(A, B).use(C).use([D, E]);
		validateStack(stack);
	});

	it('should work for multiple invocations', function() {
		var stack = stackr(A, B, C, D, E);
		validateStack(stack);
		validateStack(stack);
	});


	describe('substacks', function() {

		it('should stack correctly from multiple constructor arguments', function() {
			var substack = stackr.substack(A, B, C, D, E);
			validateStack(stackr(substack));
		});

		it('should stack correctly from array passed to constructor', function() {
			var substack = stackr.substack([A, B, C, D, E]);
			validateStack(stackr(substack));
		});

		it('should stack correctly from multiple `use` arguments', function() {
			var substack = stackr.substack().use(A, B, C, D, E);
			validateStack(stackr(substack));
		});

		it('should stack correctly from array passed to `use`', function() {
			var substack = stackr.substack().use([A, B, C, D, E]);
			validateStack(stackr(substack));
		});

		it('should stack correctly from multiple `use` calls', function() {
			var substack = stackr.substack().use(A, B).use(C).use([D, E]);
			validateStack(stackr(substack));
		});

		it('should work for multiple invocations', function() {
			var substack = stackr.substack().use(A, B).use(C).use([D, E]),
				stack = stackr(substack);
			validateStack(stack);
			validateStack(stack);
		});

	});



	it('should stack correctly when constructed with a substack', function() {
		var substack = stackr.substack(A, B),
			stack = stackr(substack, D, E);
		substack.use(C);
		validateStack(stack);
	});

	it('should stack correctly when constructed with multiple substacks', function() {
		var substack1 = stackr.substack(A, B),
			substack2 = stackr.substack(D, E),
			stack = stackr(substack1, substack2);
		substack1.use(C);
		validateStack(stack);
	});

	it('should stack correctly when constructed with nested substacks', function() {
		var substack1 = stackr.substack(A, B),
			substack2 = stackr.substack(D, E),
			stack = stackr(substack1);
		substack1.use(C, substack2);
		validateStack(stack);
	});

	it('should stack correctly when `use` is passed a substack', function() {
		var substack = stackr.substack(A, B),
			stack = stackr().use(substack, D, E);
		substack.use(C);
		validateStack(stack);
	});



	it('should result in a 404 if stack falls through', function() {
		var stack = stackr(A, B, C, D),
			response = newResponse();

		stack({}, response);

		assert.deepEqual(response.head, RESPONSES[404].head);
	});

	it('should result in a 404 with nothing in the stack', function() {
		var stack = stackr(),
			response = newResponse();

		stack({}, response);

		assert.deepEqual(response.head, RESPONSES[404].head);
	});

	it('should result in a 500 if an error occurs', function() {
		var stack = stackr(A, B, C, D, F1),
			response = newResponse();

		stack({}, response);

		assert.deepEqual(response.head, RESPONSES[500].head);
	});

	it('should result in a 500 if an error is returned', function() {
		var stack = stackr(A, B, C, D, F2),
			response = newResponse();

		stack({}, response);

		assert.deepEqual(response.head, RESPONSES[500].head);
	});

});
