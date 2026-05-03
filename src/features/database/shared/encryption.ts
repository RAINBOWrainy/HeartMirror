import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';
import { EncryptionError, EncryptionErrorCode } from './errors';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 32;
const ITERATIONS = 600000; // OWASP 2025 minimum for PBKDF2-HMAC-SHA256
const KEY_LENGTH = 32; // 256 bits
const DEK_LENGTH = 32; // 256-bit DEK

export interface EncryptedData {
  ciphertext: Buffer;
  iv: Buffer;
  salt: Buffer;
  tag: Buffer;
}

/**
 * Encrypted DEK container - enables O(1) password changes
 * DEK (Data Encryption Key) encrypts all user data
 * KEK (Key Encryption Key) derived from password encrypts the DEK
 */
export interface DekContainer {
  encryptedDek: Buffer;
  iv: Buffer;
  salt: Buffer;
  tag: Buffer;
  version: 1;
}

/**
 * Verification blob used to verify a password is correct before attempting decryption
 */
export interface PasswordVerifier {
  encrypted: EncryptedData;
  expectedHash: Buffer;
}

/**
 * Derive an encryption key from a password and salt using PBKDF2
 */
export function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt plaintext data with AES-256-GCM
 * Returns encrypted data with IV, salt, and authentication tag
 */
export function encrypt(plaintext: string, password: string): EncryptedData {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(plaintext, 'utf8');
  ciphertext = Buffer.concat([ciphertext, cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext,
    iv,
    salt,
    tag,
  };
}

/**
 * Decrypt ciphertext with AES-256-GCM
 * Throws EncryptionError with specific code on failure
 */
export function decrypt(data: EncryptedData, password: string): string {
  try {
    const key = deriveKey(password, data.salt);
    const decipher = createDecipheriv(ALGORITHM, key, data.iv);
    decipher.setAuthTag(data.tag);

    let plaintext = decipher.update(data.ciphertext);
    plaintext = Buffer.concat([plaintext, decipher.final()]);

    return plaintext.toString('utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('auth tag') || message.includes('authenticate') || message.includes('Unsupported state')) {
      throw new EncryptionError(EncryptionErrorCode.WRONG_PASSWORD, 'Incorrect password or data corrupted');
    }
    throw new EncryptionError(EncryptionErrorCode.INVALID_FORMAT, message);
  }
}

/**
 * Encrypt a JSON object and return the encrypted data structure
 */
export function encryptJson<T>(obj: T, password: string): EncryptedData {
  return encrypt(JSON.stringify(obj), password);
}

/**
 * Decrypt to a JSON object
 */
export function decryptJson<T>(data: EncryptedData, password: string): T {
  try {
    const json = decrypt(data, password);
    return JSON.parse(json) as T;
  } catch (error) {
    if (error instanceof EncryptionError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new EncryptionError(EncryptionErrorCode.INVALID_FORMAT, `JSON parse failed: ${message}`);
  }
}

// === DEK Container System ===

/**
 * Generate a random 256-bit Data Encryption Key
 */
export function generateDek(): Buffer {
  return randomBytes(DEK_LENGTH);
}

/**
 * Encrypt a DEK with a password-derived KEK
 */
export function encryptDek(dek: Buffer, password: string): DekContainer {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const kek = deriveKey(password, salt);

  const cipher = createCipheriv(ALGORITHM, kek, iv);
  let encryptedDek = cipher.update(dek);
  encryptedDek = Buffer.concat([encryptedDek, cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encryptedDek,
    iv,
    salt,
    tag,
    version: 1,
  };
}

/**
 * Decrypt a DEK with a password-derived KEK
 */
export function decryptDek(container: DekContainer, password: string): Buffer {
  try {
    const kek = deriveKey(password, container.salt);
    const decipher = createDecipheriv(ALGORITHM, kek, container.iv);
    decipher.setAuthTag(container.tag);

    let dek = decipher.update(container.encryptedDek);
    dek = Buffer.concat([dek, decipher.final()]);
    return dek;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('auth tag') || message.includes('authenticate') || message.includes('Unsupported state')) {
      throw new EncryptionError(EncryptionErrorCode.WRONG_PASSWORD, 'Incorrect password');
    }
    throw new EncryptionError(EncryptionErrorCode.INVALID_FORMAT, message);
  }
}

/**
 * Re-encrypt a DEK with a new password (O(1) password change)
 * Old data doesn't need to be re-encrypted
 */
export function reencryptDek(
  container: DekContainer,
  oldPassword: string,
  newPassword: string
): DekContainer {
  const dek = decryptDek(container, oldPassword);
  return encryptDek(dek, newPassword);
}

// === Password Verification (timing-safe) ===

/**
 * Create a password verifier blob for timing-safe verification
 * This lets us verify a password is correct before attempting data decryption
 */
export function createPasswordVerifier(password: string): PasswordVerifier {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const expectedHash = key.subarray(0, 16); // Use first 16 bytes of derived key for verification

  // Encrypt a known plaintext with the key
  const knownPlaintext = Buffer.from('heartmirror-verification');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(knownPlaintext);
  ciphertext = Buffer.concat([ciphertext, cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encrypted: { ciphertext, iv, salt, tag },
    expectedHash,
  };
}

/**
 * Timing-safe password verification
 * Prevents timing attacks by ensuring all code paths take the same amount of time
 */
export function verifyPassword(password: string, verifier: PasswordVerifier): boolean {
  try {
    const derivedKey = deriveKey(password, verifier.encrypted.salt);
    const derivedHash = derivedKey.subarray(0, 16);

    // Always perform timing-safe comparison, even if decryption would fail
    // This prevents timing attacks that could leak information about the password
    const hashMatch = timingSafeEqual(derivedHash, verifier.expectedHash);

    // Also attempt decryption to fully verify
    const decipher = createDecipheriv(ALGORITHM, derivedKey, verifier.encrypted.iv);
    decipher.setAuthTag(verifier.encrypted.tag);
    decipher.update(verifier.encrypted.ciphertext);
    decipher.final();

    return hashMatch;
  } catch {
    // Always perform a dummy timing-safe comparison even on failure
    // This prevents timing attacks on error paths
    const dummy = Buffer.alloc(16);
    timingSafeEqual(dummy, dummy);
    return false;
  }
}

// === Memory Zeroization ===
// Prevents sensitive key material from lingering in memory after use

/**
 * Securely zeroize a buffer by overwriting its contents with random data then zeros
 * This prevents sensitive key material from remaining in memory after use
 */
export function zeroize(buffer: Buffer): void {
  if (!buffer || buffer.length === 0) return;

  // Overwrite with random data first (defense-in-depth)
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }

  // Then overwrite with zeros
  buffer.fill(0);
}

/**
 * Zeroize multiple buffers at once
 */
export function zeroizeAll(...buffers: Buffer[]): void {
  for (const buffer of buffers) {
    zeroize(buffer);
  }
}

/**
 * Execute a callback with temporary key material, then zeroize afterwards
 * Ensures keys are always cleaned up even if an error is thrown
 */
export async function withZeroizedKey<T>(
  key: Buffer,
  callback: (key: Buffer) => T | Promise<T>
): Promise<T> {
  try {
    return await callback(key);
  } finally {
    zeroize(key);
  }
}
