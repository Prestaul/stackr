stackr
======

A simple http module system for node.js applications, similar to [*connect*](https://github.com/senchalabs/connect), or the more basic [*stack*](https://github.com/creationix/stack).

Stackr does not supply any middleware, it just provides an easy interface for composing a middleware stack.


Basic Usage
-----------
Stackr can be required like any other node module:
```js
var stackr = require('stackr');
```

You can construct a stack by passing middleware to the `stackr` constructor as arguments:
```js
var stack = stackr(
    require('logger')(),
    require('static')(root, mount)
);
```

 or by calling `use` on the stack:
```js
var stack = stackr()
    .use(require('logger')())
    .use(require('static')(root, mount));
```


Creating a Server
-----------------
Your stack can be used to create an http server:
```js
require('http').createServer(stackr(
    require('logger')(),
    require('static')(root, mount)
)).listen(1337);
```


Using Substacks
---------------
Substacks provide a simple way to compose more complex stacks:
```js
var substack = stackr.substack(
    require('logger')()
);

var stack = stackr(
    substack,
    require('auth')()
);

substack.use(require('static')(root, mount));
```

In the above example the execution order will be `logger`, `static`, then `auth` because the entire substack will execute before anything that follows it in the outer stack.
