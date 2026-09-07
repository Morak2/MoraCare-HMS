

class QueueNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

export class Queue {
  constructor() {
    this.front = null; // node that will be served next
    this.rear = null;  // node that was added most recently
    this._size = 0;
  }

  /** Add an item to the back of the queue. O(1) */
  enqueue(value) {
    const node = new QueueNode(value);
    if (this.rear) {
      this.rear.next = node;
    } else {
      // queue was empty — this node is both front and rear
      this.front = node;
    }
    this.rear = node;
    this._size++;
    return this._size;
  }

  /** Remove and return the item at the front of the queue. O(1) */
  dequeue() {
    if (!this.front) return null;
    const node = this.front;
    this.front = this.front.next;
    if (!this.front) this.rear = null; // queue became empty
    this._size--;
    return node.value;
  }

  /** Look at the front item without removing it. O(1) */
  peek() {
    return this.front ? this.front.value : null;
  }

  isEmpty() {
    return this._size === 0;
  }

  get size() {
    return this._size;
  }

  /** Undo helper: re-insert an item at the front (reverses a dequeue). O(1) */
  enqueueFront(value) {
    const node = new QueueNode(value);
    node.next = this.front;
    this.front = node;
    if (!this.rear) this.rear = node;
    this._size++;
    return this._size;
  }

  /** Undo helper: remove the first item matching predicate, from anywhere. O(n) */
  removeWhere(predicate) {
    let prev = null;
    let current = this.front;
    while (current) {
      if (predicate(current.value)) {
        if (prev) prev.next = current.next;
        else this.front = current.next;
        if (current === this.rear) this.rear = prev;
        this._size--;
        return current.value;
      }
      prev = current;
      current = current.next;
    }
    return null;
  }

  /** Snapshot the queue, front-to-back, as a plain array (for rendering in React). */
  toArray() {
    const result = [];
    let current = this.front;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }
}