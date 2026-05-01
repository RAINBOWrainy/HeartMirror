import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 32;
const ITERATIONS = 100000;
const KEY_LENGTH = 32; // 256 bits

export interface EncryptedData {
  ciphertext: Buffer;
  iv: Buffer;
  salt: Buffer;
  tag: Buffer;
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
 * Throws error if authentication fails (wrong password or tampered data)
 */
export function decrypt(data: EncryptedData, password: string): string {
  const key = deriveKey(password, data.salt);
  const decipher = createDecipheriv(ALGORITHM, key, data.iv);
  decipher.setAuthTag(data.tag);

  let plaintext = decipher.update(data.ciphertext);
  plaintext = Buffer.concat([plaintext, decipher.final()]);

  return plaintext.toString('utf8');
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
  const json = decrypt(data, password);
  return JSON.parse(json) as T;
}
