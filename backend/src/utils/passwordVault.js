import crypto from 'crypto';
import { getJwtSecret } from '../config/secrets.js';

/**
 * Reversible encryption for student passwords, so the admin panel can show a student's
 * current password while the database never holds it in plain text.
 * Login never uses this — it always checks the bcrypt hash in `password`.
 *
 * Key: PASSWORD_VIEW_KEY if set, otherwise derived from JWT_SECRET.
 * If that key changes, old values can no longer be shown; the admin simply resets the password.
 *
 * Format: "v1:<iv>:<authTag>:<ciphertext>" (base64 parts), AES-256-GCM.
 */
const getKey = () => {
  const base = process.env.PASSWORD_VIEW_KEY || `password-view:${getJwtSecret()}`;
  return crypto.createHash('sha256').update(base).digest();
};

export const encryptPassword = (plain) => {
  if (plain === undefined || plain === null || plain === '') return undefined;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':');
};

/** Returns the plain password, or null if missing / encrypted with a different key. */
export const decryptPassword = (stored) => {
  if (!stored || typeof stored !== 'string') return null;
  const [version, iv, tag, data] = stored.split(':');
  if (version !== 'v1' || !iv || !tag || !data) return null;
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  } catch (err) {
    return null;
  }
};
