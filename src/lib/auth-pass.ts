import { pbkdf2Sync, randomBytes } from 'crypto';

/**
 * Hash a password using PBKDF2-SHA512.
 * Returns the salt and hash in the format: salt:hash
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored format (salt:hash)
 */
export function verifyPassword(password: string, storedValue: string): boolean {
  if (!storedValue || !storedValue.includes(':')) {
    return false;
  }
  const [salt, originalHash] = storedValue.split(':');
  const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}
