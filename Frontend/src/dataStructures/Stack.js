
class StackNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

export class Stack {
  constructor() {
    this.top = null;
    this._size = 0;
  }

  /** Add an item to the top of the stack. O(1) */
  push(value) {
    const node = new StackNode(value);
    node.next = this.top;
    this.top = node;
    this._size++;
    return this._size;
  }

  /** Remove and return the item at the top of the stack. O(1) */
  pop() {
    if (!this.top) return null;
    const node = this.top;
    this.top = this.top.next;
    this._size--;
    return node.value;
  }

  /** Look at the top item without removing it. O(1) */
  peek() {
    return this.top ? this.top.value : null;
  }

  isEmpty() {
    return this._size === 0;
  }

  get size() {
    return this._size;
  }

  /** Snapshot the stack, top-to-bottom, as a plain array (for rendering in React). */
  toArray() {
    const result = [];
    let current = this.top;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }
}