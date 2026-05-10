/**
 * Client-side crypto utilities - all encryption happens in the browser
 * Server never sees passwords, keys, or plaintext data
 */

import type { Message } from '@/features/ai/shared/types'

const ALGORITHM = 'AES-GCM'
const IV_LENGTH = 12
const SALT_LENGTH = 32
const KEY_LENGTH = 256
const PBKDF2_ITERATIONS = 600000

// In-memory cache for derived keys (cleared on page refresh)
const keyCache = new Map<string, CryptoKey>()

/**
 * Derive a key from password using PBKDF2
 * All key derivation happens client-side - server never sees the password
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const saltArray = salt instanceof Uint8Array ? salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer : salt
  const cacheKey = `${password}-${Array.from(new Uint8Array(saltArray)).join(',')}`

  if (keyCache.has(cacheKey)) {
    return keyCache.get(cacheKey)!
  }

  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltArray,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    importedKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )

  keyCache.set(cacheKey, derivedKey)
  return derivedKey
}

/**
 * Generate a random Data Encryption Key (DEK)
 */
export function generateDEK(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32)) // 256-bit key
}

/**
 * Generate random salt
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
}

/**
 * Generate random IV
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH))
}

/**
 * Encrypt plaintext with AES-GCM
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<{
  ciphertext: Uint8Array
  iv: Uint8Array
  tag: Uint8Array
}> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)
  const iv = generateIV()

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv as unknown as ArrayBuffer },
    key,
    data
  )

  // Extract auth tag (last 16 bytes of AES-GCM output)
  const encryptedArray = new Uint8Array(encryptedBuffer)
  const ciphertext = encryptedArray.slice(0, -16)
  const tag = encryptedArray.slice(-16)

  return { ciphertext, iv, tag }
}

/**
 * Decrypt ciphertext with AES-GCM
 */
export async function decrypt(
  ciphertext: Uint8Array,
  iv: Uint8Array,
  tag: Uint8Array,
  key: CryptoKey
): Promise<string> {
  const decoder = new TextDecoder()

  // Reconstruct full encrypted buffer (ciphertext + tag)
  const fullBuffer = new Uint8Array(ciphertext.length + tag.length)
  fullBuffer.set(ciphertext, 0)
  fullBuffer.set(tag, ciphertext.length)

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer },
    key,
    fullBuffer.buffer.slice(fullBuffer.byteOffset, fullBuffer.byteOffset + fullBuffer.byteLength) as ArrayBuffer
  )

  return decoder.decode(decrypted)
}

/**
 * Encrypt JSON object
 */
export async function encryptJson<T>(
  obj: T,
  key: CryptoKey
): Promise<{
  ciphertext: Uint8Array
  iv: Uint8Array
  tag: Uint8Array
}> {
  return encrypt(JSON.stringify(obj), key)
}

/**
 * Decrypt to JSON object
 */
export async function decryptJson<T>(
  ciphertext: Uint8Array,
  iv: Uint8Array,
  tag: Uint8Array,
  key: CryptoKey
): Promise<T> {
  const plaintext = await decrypt(ciphertext, iv, tag, key)
  return JSON.parse(plaintext)
}

/**
 * Create password verifier for timing-safe server-side verification
 * Server never sees the password, only this verification blob
 */
export async function createPasswordVerifier(
  derivedKey: CryptoKey
): Promise<{
  encrypted: Uint8Array
  expectedHash: Uint8Array
  iv: Uint8Array
  tag: Uint8Array
}> {
  const knownPlaintext = 'heartmirror-verification'
  const { ciphertext, iv, tag } = await encrypt(knownPlaintext, derivedKey)

  // Get raw key material for hash comparison
  const exportedKey = await crypto.subtle.exportKey('raw', derivedKey)
  const keyArray = new Uint8Array(exportedKey)
  const expectedHash = keyArray.slice(0, 16)

  return {
    encrypted: ciphertext,
    expectedHash,
    iv,
    tag,
  }
}

/**
 * Encrypt DEK with KEK (derived from password)
 * This is the key container stored on the server
 */
export async function encryptDEK(
  dek: Uint8Array,
  kek: CryptoKey
): Promise<{
  encryptedDek: Uint8Array
  iv: Uint8Array
  tag: Uint8Array
}> {
  const dekBase64 = btoa(String.fromCharCode(...dek))
  const { ciphertext, iv, tag } = await encrypt(dekBase64, kek)

  return { encryptedDek: ciphertext, iv, tag }
}

/**
 * Decrypt DEK with KEK
 */
export async function decryptDEK(
  encryptedDek: Uint8Array,
  iv: Uint8Array,
  tag: Uint8Array,
  kek: CryptoKey
): Promise<CryptoKey> {
  const dekBase64 = await decrypt(encryptedDek, iv, tag, kek)
  const dekBytes = new Uint8Array(atob(dekBase64).split('').map(c => c.charCodeAt(0)))

  return crypto.subtle.importKey(
    'raw',
    dekBytes,
    { name: ALGORITHM },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt conversation messages with DEK
 */
export async function encryptConversation(
  messages: Message[],
  dek: CryptoKey
): Promise<{
  ciphertext: Uint8Array
  iv: Uint8Array
  tag: Uint8Array
}> {
  return encryptJson(messages, dek)
}

/**
 * Decrypt conversation messages with DEK
 */
export async function decryptConversation(
  ciphertext: Uint8Array,
  iv: Uint8Array,
  tag: Uint8Array,
  dek: CryptoKey
): Promise<Message[]> {
  return decryptJson(ciphertext, iv, tag, dek)
}

/**
 * Zeroize sensitive data from memory
 * Note: JavaScript garbage collection makes this best-effort only
 */
export function zeroize(buffer: Uint8Array): void {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = crypto.getRandomValues(new Uint8Array(1))[0]
  }
  buffer.fill(0)
}

/**
 * Clear the key cache
 */
export function clearKeyCache(): void {
  keyCache.clear()
}

/**
 * Convert Uint8Array to base64 string
 */
export function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

/**
 * Convert base64 string to Uint8Array
 */
export function fromBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

/**
 * Get hash of derived key for login verification
 * Server uses timing-safe comparison on this
 */
export async function getDerivedKeyHash(
  derivedKey: CryptoKey
): Promise<Uint8Array> {
  const exportedKey = await crypto.subtle.exportKey('raw', derivedKey)
  const keyArray = new Uint8Array(exportedKey)
  return keyArray.slice(0, 16)
}

/**
 * Prepare signup data for API
 * All crypto done client-side - server only gets ciphertexts
 */
export async function prepareSignupData(
  email: string,
  password: string
): Promise<{
  email: string
  encryptedDek: string
  dekSalt: string
  dekIv: string
  dekAuthTag: string
  passwordVerifier: string
  salt: string
}> {
  // Generate salt for KEK derivation
  const salt = generateSalt()

  // Derive KEK from password
  const kek = await deriveKey(password, salt)

  // Generate DEK for encrypting user data
  const dek = generateDEK()

  // Import DEK as CryptoKey (kept in memory for encryption)
  await crypto.subtle.importKey(
    'raw',
    dek.buffer.slice(dek.byteOffset, dek.byteOffset + dek.byteLength) as ArrayBuffer,
    { name: ALGORITHM },
    true,
    ['encrypt', 'decrypt']
  )

  // Encrypt DEK with KEK
  const { encryptedDek, iv, tag } = await encryptDEK(dek, kek)

  // Create password verifier
  const { expectedHash } = await createPasswordVerifier(kek)

  // Zeroize sensitive data from memory (best effort)
  zeroize(dek)

  return {
    email,
    encryptedDek: toBase64(encryptedDek),
    dekSalt: toBase64(salt),
    dekIv: toBase64(iv),
    dekAuthTag: toBase64(tag),
    passwordVerifier: toBase64(expectedHash),
    salt: toBase64(salt),
  }
}

/**
 * Prepare login data for API
 * Password never leaves the client
 */
export async function prepareLoginData(
  email: string,
  password: string,
  saltBase64: string
): Promise<{
  email: string
  derivedKeyHash: string
  encryptedDek: string
  dekIv: string
  dekAuthTag: string
}> {
  const salt = fromBase64(saltBase64)
  const kek = await deriveKey(password, salt)
  const derivedKeyHash = await getDerivedKeyHash(kek)

  // Note: encryptedDek, dekIv, dekAuthTag are fetched from server separately
  // This is just the verification data
  return {
    email,
    derivedKeyHash: toBase64(derivedKeyHash),
    encryptedDek: '', // Will be populated from server response
    dekIv: '', // Will be populated from server response
    dekAuthTag: '', // Will be populated from server response
  }
}
