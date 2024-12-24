export type LimitFunction = {
	/**
	The number of promises that are currently running.
	*/
	readonly activeCount: number;

	/**
	The number of promises that are waiting to run (i.e. their internal `fn` was not called yet).
	*/
	readonly pendingCount: number;

	/**
	Get or set the concurrency limit.
	*/
	concurrency: number;

	/**
	Discard pending promises that are waiting to run.

	This might be useful if you want to teardown the queue at the end of your program's lifecycle or discard any function calls referencing an intermediary state of your app.

	Note: This does not cancel promises that are already running.
	*/
	clearQueue: () => void;

	/**
	@param fn - Promise-returning/async function.
	@param arguments - Any arguments to pass through to `fn`. Support for passing arguments on to the `fn` is provided in order to be able to avoid creating unnecessary closures. You probably don't need this optimization unless you're pushing a lot of functions.
	@returns The promise returned by calling `fn(...arguments)`.
	*/
	<Arguments extends unknown[], ReturnType>(
		function_: (...arguments_: Arguments) => PromiseLike<ReturnType> | ReturnType,
		...arguments_: Arguments
	): Promise<ReturnType>;
};


type Arguments = unknown[]
type PLimitTask = (...args: Arguments) => Promise<unknown>


interface QueueEle {
    task: PLimitTask;
    resolve: Function;
    reject: Function;
    args: Arguments;
}

type QueueNode<T> = {
    value: T;
    next: QueueNode<T> | null;
}

/**
 * 链表的方式实现队列
 */
class Queue<T>{
    header: QueueNode<T> | null = null
    tail: QueueNode<T> | null = null
    size: number = 0
    push(value: T){
        const node = {value, next: null}
        if(this.size === 0) {
            this.header = node
            this.tail = node
        }else {
            this.tail!.next = node
            this.tail = node
        }
        this.size++
    }
    shift(): T | null {
        if(this.size === 0) return null
        const node = this.header
        this.header = this.header!.next
        this.size--
        return node!.value
    }

    isExist(predicate: (value: T)=> boolean): boolean {
        let node = this.header;
        while (node) {
            if (predicate(node.value)) {
                return true
            }
            node = node.next;
        }
        return false
    }

    delete(predicate: (value: T)=> boolean) {
        let node = this.header;
        let pre = null;
    
        while (node) {
            if (predicate(node.value)) {
                if (node === this.header) {
                    this.header = this.header.next;
                    if (node === this.tail) {
                        this.tail = null; // 如果只有一个节点
                    }
                } else if (node === this.tail) {
                    this.tail = pre;
                    if (pre) {
                        pre.next = null;
                    }
                } else {
                    pre!.next = node.next;
                }
                this.size--;
                return; // 找到并删除节点后退出
            }
            pre = node;
            node = node.next;
        }
    }

    get length(){
        return this.size
    }
    clear(){
        this.header = null
        this.tail = null
        this.size = 0
    }
}


export function concurrencyQueue(concurrency: number): LimitFunction {
    let queue: Queue<QueueEle> = new Queue()
    const runningTask: Array<PLimitTask> = []

    let _concurrency = concurrency
    
    const generator = function<ReturnType>(task: PLimitTask, ...args: Arguments): Promise<ReturnType> {
        if(concurrency <= 0) 
            throw new Error(`concurrency must greater than 0`)
        if(runningTask.length < _concurrency) {
            const promise = new Promise<ReturnType>((resolve, reject) => {
                return runTask(task, resolve, reject, args)
             })
             return promise
        }else {
            const promise = new Promise<ReturnType>((resolve, reject) => {
                queue.push({task, resolve, reject, args})
            })
            return promise.finally(()=> {})   /** 这里必须加finally... */
        }
    }

    Object.defineProperties(generator, {
        activeCount: {
            get: function(){ 
                return runningTask.length
            }
        },
        pendingCount: {
            get: function() {
                return queue.length
            }
        },
        clearQueue: {
            value: function() {
                queue.clear()
            }
        },
        concurrency: {
            get: function() {
                return _concurrency
            },
            set: function(newValue: number){
                if(newValue <= 0) 
                    throw new Error(`concurrency must greater than 0`)

                // 如果加大了并行任务的数量，从队列中拿出任务进行执行
                const delta = newValue -_concurrency
                _concurrency = newValue
                if(delta > 0) {
                    for(let i =0; i < delta && queue.length > 0; i++) {
                        const queueEle = queue.shift()
                        runTask(queueEle!.task, queueEle!.resolve, queueEle!.reject, queueEle!.args)
                    }
                }
                
            }
        }
    })

    return generator as LimitFunction;

    function runTask(task: PLimitTask, resolve: Function, reject: Function, args:Arguments){
        runningTask.push(task)
        return task(...args)
                .then((res) => resolve(res))
                .catch((err) => reject(err))
                .finally(() => {
                    console.log('finally')
                    runningTask.splice(runningTask.findIndex((item) => item === task ), 1)
                    // 查看队列是否还有任务，有任务则继续
                    if(queue.length > 0 && runningTask.length <= _concurrency) {
                        const queueEle = queue.shift()
                        if(queueEle) {
                            const {task, resolve, reject, args} = queueEle
                            runTask(task, resolve, reject, args)
                        }
                    }
                })
    }
}
