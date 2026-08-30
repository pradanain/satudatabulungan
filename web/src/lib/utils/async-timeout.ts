export class AsyncTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AsyncTimeoutError";
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }

  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => {
        reject(new AsyncTimeoutError(timeoutMessage));
      }, timeoutMs);
    }),
  ]);
}

