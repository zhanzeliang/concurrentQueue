# concurrentQueue

> Run multiple promise-returning & async functions with limited concurrency
> This library has similar functionality to [p-limit](https://github.com/sindresorhus/p-limit/tree/main) but with defferent implementation

*Works in Node.js and browsers.*
```

## Usage

```js
import { concurrencyQueue } from '../src/index';

const limit = concurrencyQueue(1);

function fetchSomething(msg: string) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(msg);
    }, 1000);
  });
}

function doSomething() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('doSomething');
    }, 1000);
  });
}

const input = [
	limit(() => fetchSomething('foo')),
	limit(() => fetchSomething('bar')),
	limit(() => doSomething())
];

// Only one promise is run at once
const result = await Promise.all(input);
console.log(result);
```

## API

### concurrencyQueue(concurrency) 

Returns a `limit` function.

#### concurrency

Type: `number`\
Minimum: `1`

Concurrency limit.

### limit(fn, ...args)

Returns the promise returned by calling `fn(...args)`.

#### fn

Type: `Function`

Promise-returning/async function.

#### args

Any arguments to pass through to `fn`.

Support for passing arguments on to the `fn` is provided in order to be able to avoid creating unnecessary closures. You probably don't need this optimization unless you're pushing a *lot* of functions.

### limit.activeCount

The number of promises that are currently running.

### limit.pendingCount

The number of promises that are waiting to run (i.e. their internal `fn` was not called yet).

### limit.clearQueue()

Discard pending promises that are waiting to run.

This might be useful if you want to teardown the queue at the end of your program's lifecycle or discard any function calls referencing an intermediary state of your app.

Note: This does not cancel promises that are already running.

### limit.concurrency

Get or set the concurrency limit.

