import { describe, it, expect } from 'vitest';
import {
  encrypt,
  decrypt,
  encryptJson,
  decryptJson,
  deriveKey,
  generateDek,
  encryptDek,
  decryptDek,
  reencryptDek,
  createPasswordVerifier,
  verifyPassword,
} from '@/features/database/shared/encryption';
import { EncryptionError, EncryptionErrorCode } from '@/features/database/shared/errors';

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

    it('throws WRONG_PASSWORD error when decrypting with wrong password', () => {
      const plaintext = 'Secret message';
      const encrypted = encrypt(plaintext, 'correct-password');

      expect(() => decrypt(encrypted, 'wrong-password')).toThrow(EncryptionError);

      try {
        decrypt(encrypted, 'wrong-password');
      } catch (error) {
        expect(error).toBeInstanceOf(EncryptionError);
        expect((error as EncryptionError).code).toBe(EncryptionErrorCode.WRONG_PASSWORD);
      }
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

    it('throws INVALID_FORMAT error when decrypting corrupted JSON', () => {
      const password = 'test-password';
      const encrypted = encrypt('not-valid-json', password);

      try {
        decryptJson(encrypted, password);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(EncryptionError);
        expect((error as EncryptionError).code).toBe(EncryptionErrorCode.INVALID_FORMAT);
      }
    });
  });

  describe('DEK Container System', () => {
    it('generates a 32-byte DEK', () => {
      const dek = generateDek();
      expect(dek).toBeInstanceOf(Buffer);
      expect(dek.length).toBe(32);
    });

    it('encrypts and decrypts a DEK with the same password', () => {
      const dek = generateDek();
      const password = 'master-password';

      const container = encryptDek(dek, password);
      expect(container.version).toBe(1);
      expect(container.encryptedDek).toBeInstanceOf(Buffer);
      expect(container.iv.length).toBe(12);
      expect(container.salt.length).toBe(32);
      expect(container.tag.length).toBe(16);

      const decryptedDek = decryptDek(container, password);
      expect(decryptedDek).toEqual(dek);
    });

    it('throws WRONG_PASSWORD error when decrypting DEK with wrong password', () => {
      const dek = generateDek();
      const container = encryptDek(dek, 'correct-password');

      try {
        decryptDek(container, 'wrong-password');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(EncryptionError);
        expect((error as EncryptionError).code).toBe(EncryptionErrorCode.WRONG_PASSWORD);
      }
    });

    it('re-encrypts DEK with new password without changing the DEK itself', () => {
      const dek = generateDek();
      const oldPassword = 'old-password';
      const newPassword = 'new-password';

      const oldContainer = encryptDek(dek, oldPassword);
      const newContainer = reencryptDek(oldContainer, oldPassword, newPassword);

      // The DEK should be identical after re-encryption
      const decryptedFromNew = decryptDek(newContainer, newPassword);
      expect(decryptedFromNew).toEqual(dek);

      // Old password should not work with new container
      expect(() => decryptDek(newContainer, oldPassword)).toThrow();
    });
  });

  describe('Password Verification (timing-safe)', () => {
    it('creates a verifier and correctly verifies the right password', () => {
      const password = 'my-secret-password';
      const verifier = createPasswordVerifier(password);

      expect(verifier.encrypted).toBeDefined();
      expect(verifier.expectedHash).toBeInstanceOf(Buffer);
      expect(verifier.expectedHash.length).toBe(16);

      const isValid = verifyPassword(password, verifier);
      expect(isValid).toBe(true);
    });

    it('rejects wrong password during verification', () => {
      const password = 'correct-password';
      const verifier = createPasswordVerifier(password);

      const isValid = verifyPassword('wrong-password', verifier);
      expect(isValid).toBe(false);
    });

    it('is deterministic - same password produces same verification result', () => {
      const password = 'test-password';
      const verifier = createPasswordVerifier(password);

      for (let i = 0; i < 5; i++) {
        expect(verifyPassword(password, verifier)).toBe(true);
      }
    });
  });
});
