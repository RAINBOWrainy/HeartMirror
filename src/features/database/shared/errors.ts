export enum EncryptionErrorCode {
  WRONG_PASSWORD = 'WRONG_PASSWORD',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  MIGRATION_REQUIRED = 'MIGRATION_REQUIRED',
}

export class EncryptionError extends Error {
  public readonly code: EncryptionErrorCode;

  constructor(code: EncryptionErrorCode, message: string) {
    super(message);
    this.name = 'EncryptionError';
    this.code = code;
  }
}

export function isEncryptionError(error: unknown): error is EncryptionError {
  return error instanceof EncryptionError;
}
