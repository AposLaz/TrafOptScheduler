/**
 *  This Semaphore class is used to control the maximum number of concurrent tasks that can run at the same time.
 *
 *  The constructor method initializes the Semaphore with a maximum number of tasks.
 *
 *  The acquire method is used to request a task slot. If there are available slots, it increments the
 *  current number of tasks and resolves the returned promise. If there are no available slots, it adds the promise to a queue
 *  and waits for a slot to become available.
 *
 *  The release method is used to release a task slot. It decrements the current number of tasks and if there are tasks waiting
 *  in the queue, it resolves the next one.
 *
 *  This class is useful for controlling concurrency in asynchronous code, preventing too many tasks from running at the same time
 *  and potentially causing performance issues.
 */

// export class Semaphore {
//   private static instance: Semaphore | null = null;

//   private max: number;
//   private current: number;
//   private queue: (() => void)[];

//   // Private constructor prevents direct instantiation
//   private constructor(max: number) {
//     this.max = max;
//     this.current = 0;
//     this.queue = [];
//   }

//   // Static method to get the single instance of the class
//   public static getInstance(max: number): Semaphore {
//     if (this.instance === null) {
//       this.instance = new Semaphore(max);
//     }
//     return this.instance;
//   }

//   async acquire(): Promise<void> {
//     if (this.current < this.max) {
//       this.current++;
//       return Promise.resolve();
//     } else {
//       return new Promise<void>((resolve) => {
//         this.queue.push(resolve);
//       });
//     }
//   }

//   release(): void {
//     this.current--;
//     if (this.queue.length > 0) {
//       const nextResolve = this.queue.shift();
//       this.current++;
//       if (nextResolve) {
//         nextResolve();
//       }
//     }
//   }
// }
