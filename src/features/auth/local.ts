import { deriveKey } from '@/features/database/shared/encryption';

const PASSWORD_HASH_KEY = 'heartmirror-password-hash';
const SALT_KEY = 'heartmirror-salt';

// Store the current unlocked password in memory after verification
let currentPassword: string | null = null;

/**
 * Set a password for local mode
 * Returns the derived key
 */
export async function setLocalPassword(password: string): Promise<Buffer> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(32));
  const saltBuffer = Buffer.from(saltBytes);
  const key = deriveKey(password, saltBuffer);

  // Store salt and key hash for verification
  localStorage.setItem(SALT_KEY, saltBuffer.toString('hex'));
  // Store a hash of the key (not the key itself) for verification
  // This way we don't have the raw key in localStorage unless unlocked
  const hashBuffer = await crypto.subtle.digest('SHA-256', key.buffer as ArrayBuffer);
  const hashHex = Buffer.from(hashBuffer).toString('hex');
  localStorage.setItem(PASSWORD_HASH_KEY, hashHex);

  // Store password in memory for database encryption/decryption
  currentPassword = password;

  return key;
}

/**
 * Verify a password for local mode
 */
export async function verifyLocalPassword(password: string): Promise<boolean> {
  const savedSalt = localStorage.getItem(SALT_KEY);
  if (!savedSalt) {
    currentPassword = password;
    return true; // No password set
  }

  const salt = Buffer.from(savedSalt, 'hex');
  const key = deriveKey(password, salt);
  // Compare hash with stored hash
  const storedHash = localStorage.getItem(PASSWORD_HASH_KEY);
  if (!storedHash) return false;

  const hashBuffer = await crypto.subtle.digest('SHA-256', key.buffer as ArrayBuffer);
  const computedHash = Buffer.from(hashBuffer).toString('hex');

  if (computedHash === storedHash) {
    currentPassword = password;
    return true;
  }

  return false;
}

/**
 * Check if password protection is enabled
 */
export function hasLocalPassword(): boolean {
  return localStorage.getItem(SALT_KEY) !== null;
}

/**
 * Get the current unlocked password (after verification)
 */
export function getLocalPassword(): string | null {
  return currentPassword;
}

/**
 * Clear password (disable protection)
 */
export function clearLocalPassword(): void {
  localStorage.removeItem(PASSWORD_HASH_KEY);
  localStorage.removeItem(SALT_KEY);
  currentPassword = null;
}
