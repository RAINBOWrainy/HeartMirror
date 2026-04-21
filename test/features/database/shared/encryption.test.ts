import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, encryptJson, decryptJson, deriveKey } from '@/features/database/shared/encryption';

describe('encryption', () => {
  describe('deriveKey', () => {
    it('derives a 32-byte key from password and salt', () => {
      const salt = Buffer.from('deadbeef', 'hex');
      const key = deriveKey('test-password', salt);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32); // 256 bits
    });
  });

  describe('encrypt/decrypt', () => {
    it('encrypts and decrypts text correctly with the same password', () => {
      const plaintext = 'Hello, world! This is a test of encryption.';
      const password = 'my-secret-password';

      const encrypted = encrypt(plaintext, password);

      // Check that all required fields are present and have correct lengths
      expect(encrypted.ciphertext).toBeInstanceOf(Buffer);
      expect(encrypted.iv).toBeInstanceOf(Buffer);
      expect(encrypted.iv.length).toBe(12);
      expect(encrypted.salt).toBeInstanceOf(Buffer);
      expect(encrypted.salt.length).toBe(32);
      expect(encrypted.tag).toBeInstanceOf(Buffer);
      expect(encrypted.tag.length).toBe(16);

      // Decrypt and verify
      const decrypted = decrypt(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });

    it('throws error when decrypting with wrong password', () => {
      const plaintext = 'Secret message';
      const encrypted = encrypt(plaintext, 'correct-password');

      expect(() => decrypt(encrypted, 'wrong-password')).toThrow();
    });

    it('produces different ciphertexts for same plaintext due to random salt/iv', () => {
      const plaintext = 'Same text';
      const password = 'password';

      const enc1 = encrypt(plaintext, password);
      const enc2 = encrypt(plaintext, password);

      // Ciphertext should be different because of randomness
      expect(enc1.ciphertext).not.toEqual(enc2.ciphertext);
      expect(enc1.iv).not.toEqual(enc2.iv);
      expect(enc1.salt).not.toEqual(enc2.salt);

      // But both should decrypt correctly
      expect(decrypt(enc1, password)).toBe(plaintext);
      expect(decrypt(enc2, password)).toBe(plaintext);
    });
  });

  describe('encryptJson/decryptJson', () => {
    it('encrypts and decrypts JSON objects correctly', () => {
      const obj = {
        id: 123,
        text: 'Hello',
        tags: ['a', 'b', 'c'],
        active: true,
      };
      const password = 'json-password';

      const encrypted = encryptJson(obj, password);
      const decrypted = decryptJson<typeof obj>(encrypted, password);

      expect(decrypted).toEqual(obj);
    });
  });
});
