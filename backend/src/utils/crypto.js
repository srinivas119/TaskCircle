import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 * @returns {string} 6-digit OTP
 */
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hashes a string using bcryptjs.
 * @param {string} value String to hash
 * @returns {Promise<string>} BCRYPT hash
 */
export const hashValue = async (value) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(value, salt);
};

/**
 * Compares a plaintext string with a bcrypt hash.
 * @param {string} value Plaintext value
 * @param {string} hash Bcrypt hash
 * @returns {Promise<boolean>} Match status
 */
export const compareHash = async (value, hash) => {
  return bcrypt.compare(value, hash);
};

/**
 * Generates a secure random session ID token (64 hex characters).
 * @returns {string} Secure session token
 */
export const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};
