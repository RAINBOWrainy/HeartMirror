/**
 * Promise-based wrapper for the PBKDF2 WebWorker
 * Offloads CPU-intensive crypto operations from main thread
 */

type WorkerRequest =
  | { type: 'deriveKey'; password: string; salt: string }
  | { type: 'deriveKeyWithNewSalt'; password: string }
  | { type: 'verifyPassword'; password: string; salt: string; expectedHash: string }
  | { type: 'generateDek' };

interface WorkerResponse {
  type: string;
  requestId: number;
  key?: string;
  salt?: string;
  isValid?: boolean;
  dek?: string;
  error?: string;
}

class CryptoWorker {
  private worker: Worker | null = null;
  private pendingRequests = new Map<number, { resolve: (value: unknown) => void; reject: (reason: unknown) => void }>();
  private requestIdCounter = 0;

  private init(): Worker {
    if (this.worker) return this.worker;

    // Webpack 5 + Next.js worker syntax
    this.worker = new Worker(new URL('@/workers/crypto.worker', import.meta.url));

    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { requestId, error } = e.data;
      const pending = this.pendingRequests.get(requestId);

      if (!pending) return;

      this.pendingRequests.delete(requestId);

      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(e.data);
      }
    };

    this.worker.onerror = (error) => {
      console.error('CryptoWorker error:', error);
      // Reject all pending requests
      for (const pending of this.pendingRequests.values()) {
        pending.reject(new Error('Worker error'));
      }
      this.pendingRequests.clear();
    };

    return this.worker;
  }

  private postMessage<T>(message: WorkerRequest): Promise<T> {
    const worker = this.init();
    const requestId = this.requestIdCounter++;

    return new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(requestId, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      worker.postMessage({ ...message, requestId });
    });
  }

  /**
   * Derive a key from password and salt in a WebWorker
   */
  async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    const result = await this.postMessage<{ key: string }>({
      type: 'deriveKey',
      password,
      salt: salt.toString('base64'),
    });
    return Buffer.from(result.key, 'base64');
  }

  /**
   * Derive a key with a new random salt in a WebWorker
   */
  async deriveKeyWithNewSalt(password: string): Promise<{ key: Buffer; salt: Buffer }> {
    const result = await this.postMessage<{ key: string; salt: string }>({
      type: 'deriveKeyWithNewSalt',
      password,
    });
    return {
      key: Buffer.from(result.key, 'base64'),
      salt: Buffer.from(result.salt, 'base64'),
    };
  }

  /**
   * Timing-safe password verification in a WebWorker
   */
  async verifyPassword(password: string, salt: Buffer, expectedHash: Buffer): Promise<boolean> {
    const result = await this.postMessage<{ isValid: boolean }>({
      type: 'verifyPassword',
      password,
      salt: salt.toString('base64'),
      expectedHash: expectedHash.toString('base64'),
    });
    return result.isValid;
  }

  /**
   * Generate a random DEK in a WebWorker
   */
  async generateDek(): Promise<Buffer> {
    const result = await this.postMessage<{ dek: string }>({
      type: 'generateDek',
    });
    return Buffer.from(result.dek, 'base64');
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    for (const pending of this.pendingRequests.values()) {
      pending.reject(new Error('Worker terminated'));
    }
    this.pendingRequests.clear();
  }
}

// Singleton instance
export const cryptoWorker = new CryptoWorker();
