/**
 * WebWorker for PBKDF2 key derivation
 * Offloads CPU-intensive crypto operations from main thread to prevent UI freeze
 */
import { pbkdf2Sync, timingSafeEqual, randomBytes } from 'crypto';

const ITERATIONS = 600000; // OWASP 2025 minimum
const KEY_LENGTH = 32;
const SALT_LENGTH = 32;

type WorkerMessage =
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

let requestIdCounter = 0;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const requestId = requestIdCounter++;

  try {
    switch (e.data.type) {
      case 'deriveKey': {
        const password = e.data.password;
        const salt = Buffer.from(e.data.salt, 'base64');
        const key = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
        self.postMessage({
          type: 'deriveKeyResult',
          requestId,
          key: key.toString('base64'),
        } as WorkerResponse);
        break;
      }

      case 'deriveKeyWithNewSalt': {
        const password = e.data.password;
        const salt = randomBytes(SALT_LENGTH);
        const key = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
        self.postMessage({
          type: 'deriveKeyResult',
          requestId,
          key: key.toString('base64'),
          salt: salt.toString('base64'),
        } as WorkerResponse);
        break;
      }

      case 'verifyPassword': {
        const password = e.data.password;
        const salt = Buffer.from(e.data.salt, 'base64');
        const expectedHash = Buffer.from(e.data.expectedHash, 'base64');
        const derivedKey = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
        const derivedHash = derivedKey.subarray(0, 16);
        const isValid = timingSafeEqual(derivedHash, expectedHash);
        self.postMessage({
          type: 'verifyPasswordResult',
          requestId,
          isValid,
        } as WorkerResponse);
        break;
      }

      case 'generateDek': {
        const dek = randomBytes(32);
        self.postMessage({
          type: 'generateDekResult',
          requestId,
          dek: dek.toString('base64'),
        } as WorkerResponse);
        break;
      }

      default:
        self.postMessage({
          type: 'error',
          requestId,
          error: `Unknown message type: ${(e.data as WorkerMessage).type}`,
        } as WorkerResponse);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      requestId,
      error: error instanceof Error ? error.message : String(error),
    } as WorkerResponse);
  }
};
