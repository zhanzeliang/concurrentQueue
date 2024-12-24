import { concurrencyQueue } from '../src/index';

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

describe('concurrencyQueue', () => {
  it('should limit concurrency', async () => {
    const limit = concurrencyQueue(2);

    const input = [
      limit(() => fetchSomething('foo')),
      limit(() => fetchSomething('bar')),
      limit(() => doSomething())
    ];

    const results = await Promise.all(input);
    expect(results).toEqual(['foo', 'bar', 'doSomething']);
  });

  it('should queue be empty when all promise fullfil', async () => {
    const limit = concurrencyQueue(1);

    const input = [
      limit(() => fetchSomething('foo')),
      limit(() => fetchSomething('bar')),
      limit(() => doSomething())
    ];
    await Promise.allSettled(input);
    expect(limit.pendingCount).toBe(0);
    expect(limit.activeCount).toBe(0);
  });

  it('should return activeCount and pendingCount', async () => {
    const limit = concurrencyQueue(1);

    const input = [
      limit(() => fetchSomething('foo')),
      limit(() => fetchSomething('bar')),
      limit(() => doSomething())
    ];

    expect(limit.activeCount).toBe(1);
    expect(limit.pendingCount).toBe(2);``

    await Promise.all(input)
    
    console.log('执行完成')
    expect(limit.activeCount).toBe(0);
    expect(limit.pendingCount).toBe(0);
  });
});