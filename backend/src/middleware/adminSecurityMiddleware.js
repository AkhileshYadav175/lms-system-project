import { getAdminGatewayToken, getErpApiKey, safeEqual } from '../config/secrets.js';
import { verifyAdmin } from './authMiddleware.js';

// NOTE: the gateway token is sent by the browser, so it is NOT a secret — it only hides the
// admin API from casual scanners. Real protection always comes from verifyAdmin (JWT + session).

/**
 * Middleware to verify Admin Gateway signature on admin routes.
 * Enforces strict hidden slug & authorized portal gateway access.
 */
export const verifyAdminGateway = (req, res, next) => {
  const token = req.headers['x-admin-gateway-token'] || req.headers['x-admin-gateway-key'];

  // Graceful fallback for test runner unless strict gateway testing is explicitly requested
  if (process.env.NODE_ENV === 'test' && !token && !process.env.REQUIRE_ADMIN_GATEWAY) {
    return next();
  }

  if (!token || !safeEqual(token, getAdminGatewayToken())) {
    console.warn(`[SECURITY] Blocked unauthorized admin route access attempt from IP: ${req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid or missing Admin Gateway signature'
    });
  }

  next();
};

/**
 * Honeypot Trap endpoint controller
 * Logs probe attempts from bots or scanners targeting deprecated /admin paths.
 */
export const recordHoneypotProbe = (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  const { targetPath, referrer, userAgent, timestamp } = req.body || {};

  console.warn(`
🚨 [HONEYPOT ALERT] Malicious or unauthorized admin scanner trapped!
   - IP: ${ip}
   - Target: ${targetPath || 'Unknown path'}
   - User-Agent: ${userAgent || req.headers['user-agent'] || 'Unknown'}
   - Referrer: ${referrer || req.headers['referer'] || 'None'}
   - Time: ${timestamp || new Date().toISOString()}
  `);

  // Silent success response so scanners are not alerted
  return res.status(200).json({
    success: true,
    message: 'Telemetry logged'
  });
};


/**
 * Account provisioning guard: allows the ERP bridge (X-API-KEY) or an authenticated admin.
 * Sets req.provisioningAuthorized for the controller.
 */
export const allowBridgeOrAdmin = (req, res, next) => {
  const bridgeKey = req.headers['x-api-key'] || req.headers['x-bridge-key'];
  if (bridgeKey && safeEqual(String(bridgeKey), getErpApiKey())) {
    req.provisioningAuthorized = true;
    return next();
  }

  const hasCredentials = req.headers.authorization || (req.cookies && req.cookies.admin_token);
  if (!hasCredentials) {
    req.provisioningAuthorized = false;
    return next(); // controller answers with REGISTRATION_DISABLED
  }

  return verifyAdmin(req, res, () => {
    req.provisioningAuthorized = true;
    next();
  });
};
