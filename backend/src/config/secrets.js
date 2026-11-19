import crypto from 'crypto';

/**
 * Central access to secrets. There are deliberately NO hard-coded fallbacks:
 * a missing secret in production must fail loudly instead of silently using a
 * value that is public in the git history.
 *
 * Values are read lazily (at call time) so the order in which modules are
 * imported never matters, and tests can set them in their setup file.
 */

const REQUIRED_SECRETS = ['JWT_SECRET', 'ERP_API_KEY', 'ADMIN_GATEWAY_TOKEN'];

const isTest = () => process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

const readSecret = (name) => {
  const value = process.env[name];
  if (value && value.trim()) return value.trim();
  if (isTest()) return `test_${name.toLowerCase()}`;
  throw new Error(`[CONFIG] Missing required secret ${name}. Set it in backend/.env (see .env.example).`);
};

export const getJwtSecret = () => readSecret('JWT_SECRET');
export const getErpApiKey = () => readSecret('ERP_API_KEY');
export const getAdminGatewayToken = () => readSecret('ADMIN_GATEWAY_TOKEN');

/** Call once on server start: exits early with a clear message if anything is missing. */
export const assertRequiredSecrets = () => {
  if (isTest()) return;
  const missing = REQUIRED_SECRETS.filter((name) => !process.env[name] || !process.env[name].trim());
  if (missing.length > 0) {
    throw new Error(
      `[CONFIG] Missing required environment variables: ${missing.join(', ')}. ` +
        'Add them to backend/.env before starting the server.'
    );
  }
};

/** Constant-time string comparison for API keys / tokens. */
export const safeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};
