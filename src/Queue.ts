type QueueNode<T> = {
    value: T;
    next: QueueNode<T> | null;
}

/**
 * 链表的方式实现队列
 */
export default class Queue<T>{
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