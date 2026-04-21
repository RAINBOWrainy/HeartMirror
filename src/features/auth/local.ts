import { deriveKey } from '@/features/database/shared/encryption';

const PASSWORD_HASH_KEY = 'heartmirror-password-hash';
const SALT_KEY = 'heartmirror-salt';

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

  return key;
}

/**
 * Verify a password for local mode
 */
export async function verifyLocalPassword(password: string): Promise<boolean> {
  const savedSalt = localStorage.getItem(SALT_KEY);
  if (!savedSalt) return true; // No password set

  const salt = Buffer.from(savedSalt, 'hex');
  const key = deriveKey(password, salt);
  // Compare hash with stored hash
  const storedHash = localStorage.getItem(PASSWORD_HASH_KEY);
  if (!storedHash) return false;

  const hashBuffer = await crypto.subtle.digest('SHA-256', key.buffer as ArrayBuffer);
  const computedHash = Buffer.from(hashBuffer).toString('hex');

  return computedHash === storedHash;
}

/**
 * Check if password protection is enabled
 */
export function hasLocalPassword(): boolean {
  return localStorage.getItem(SALT_KEY) !== null;
}

/**
 * Clear password (disable protection)
 */
export function clearLocalPassword(): void {
  localStorage.removeItem(PASSWORD_HASH_KEY);
  localStorage.removeItem(SALT_KEY);
}
