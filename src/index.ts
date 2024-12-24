import Queue from "./Queue";
import type { LimitFunction } from './types'


type Arguments = unknown[]
type PLimitTask = (...args: Arguments) => Promise<unknown>


interface QueueEle {
    task: PLimitTask;
    resolve: Function;
    reject: Function;
    args: Arguments;
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
