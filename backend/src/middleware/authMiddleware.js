import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/secrets.js';
import Admin from '../models/Admin.js';
import Student from '../models/Student.js';

// Fast in-memory session cache to avoid repeated MongoDB Atlas roundtrips on concurrent requests
// Map<userId, { role, currentSessionId, activeSessions, status, cachedAt }>
const sessionCache = new Map();
const SESSION_CACHE_TTL_MS = 30 * 1000; // 30 seconds TTL

export const invalidateUserSessionCache = (userId) => {
  if (userId) {
    sessionCache.delete(userId.toString());
  }
};

export const clearSessionCache = () => {
  sessionCache.clear();
};

const getCachedOrFetchUser = async (userId, role) => {
  const key = userId.toString();
  const cached = sessionCache.get(key);
  const now = Date.now();

  if (cached && (now - cached.cachedAt < SESSION_CACHE_TTL_MS)) {
    return cached.user;
  }

  let user = null;
  if (role === 'admin') {
    user = await Admin.findById(userId).select('_id currentSessionId activeSessions').lean();
  } else if (role === 'student') {
    user = await Student.findById(userId).select('_id currentSessionId status').lean();
  }

  if (user) {
    sessionCache.set(key, { user, cachedAt: now });
  } else {
    sessionCache.delete(key);
  }

  return user;
};

// Collect candidate tokens with explicit Authorization header and query param taking precedence
const extractTokens = (req, preferredCookie) => {
  const tokens = [];
  
  // 1. Authorization header (explicit for this specific request)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    tokens.push(authHeader.substring(7));
  }

  // 2. Query token (e.g. HLS playlist / segment requests)
  if (req.query && req.query.token) {
    tokens.push(req.query.token);
  }

  // 3. Preferred cookie for this role
  if (preferredCookie && req.cookies && req.cookies[preferredCookie]) {
    tokens.push(req.cookies[preferredCookie]);
  }

  // 4. Other cookies (fallback)
  if (req.cookies) {
    if (preferredCookie !== 'admin_token' && req.cookies.admin_token) tokens.push(req.cookies.admin_token);
    if (preferredCookie !== 'student_token' && req.cookies.student_token) tokens.push(req.cookies.student_token);
    if (req.cookies.token) tokens.push(req.cookies.token);
  }

  // Deduplicate tokens
  return Array.from(new Set(tokens.filter(Boolean)));
};

export const verifyAdmin = async (req, res, next) => {
  const possibleTokens = extractTokens(req, 'admin_token');

  if (possibleTokens.length === 0) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  let hasValidTokenWrongRole = false;
  let encounteredSessionConflict = false;

  for (const token of possibleTokens) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      if (decoded.role === 'admin') {
        const admin = await getCachedOrFetchUser(decoded.userId, 'admin');
        if (admin && decoded.sessionId) {
          const isActiveSession = Array.isArray(admin.activeSessions) && admin.activeSessions.includes(decoded.sessionId);
          const isCurrentSession = admin.currentSessionId === decoded.sessionId;

          if (!isActiveSession && !isCurrentSession) {
            encounteredSessionConflict = true;
            continue; // Check if another token is valid before failing
          }
        }
        req.user = decoded;
        req.token = token;
        return next();
      } else {
        hasValidTokenWrongRole = true;
      }
    } catch (err) {
      // Continue to next candidate token
    }
  }

  if (encounteredSessionConflict) {
    return res.status(401).json({ success: false, message: 'SESSION_CONFLICT' });
  }

  if (hasValidTokenWrongRole) {
    return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
  }

  return res.status(401).json({ success: false, message: 'Unauthorized or invalid token' });
};

export const verifyStudent = async (req, res, next) => {
  const possibleTokens = extractTokens(req, 'student_token');

  if (possibleTokens.length === 0) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  let hasValidTokenWrongRole = false;
  let encounteredSessionConflict = false;

  for (const token of possibleTokens) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      if (decoded.role === 'student') {
        const student = await getCachedOrFetchUser(decoded.userId, 'student');
        if (!student || student.status === 'blocked') {
          return res.status(403).json({ success: false, message: 'Your account has been blocked' });
        }
        if (student.currentSessionId && decoded.sessionId && student.currentSessionId !== decoded.sessionId) {
          encounteredSessionConflict = true;
          continue; // Check if another candidate token matches before failing
        }
        req.user = decoded;
        req.token = token;
        return next();
      } else {
        hasValidTokenWrongRole = true;
      }
    } catch (err) {
      // Continue to next candidate token
    }
  }

  if (encounteredSessionConflict) {
    return res.status(401).json({ success: false, message: 'SESSION_CONFLICT' });
  }

  if (hasValidTokenWrongRole) {
    return res.status(403).json({ success: false, message: 'Forbidden: Student access required' });
  }

  return res.status(401).json({ success: false, message: 'Unauthorized or invalid token' });
};

export const verifyAuth = async (req, res, next) => {
  const possibleTokens = extractTokens(req);

  if (possibleTokens.length === 0) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  let encounteredSessionConflict = false;

  for (const token of possibleTokens) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      let userDoc = null;

      if (decoded.role === 'admin') {
        userDoc = await getCachedOrFetchUser(decoded.userId, 'admin');
        if (userDoc && decoded.sessionId) {
          const isActiveSession = Array.isArray(userDoc.activeSessions) && userDoc.activeSessions.includes(decoded.sessionId);
          const isCurrentSession = userDoc.currentSessionId === decoded.sessionId;
          if (!isActiveSession && !isCurrentSession) {
            encounteredSessionConflict = true;
            continue;
          }
        }
      } else if (decoded.role === 'student') {
        userDoc = await getCachedOrFetchUser(decoded.userId, 'student');
        if (!userDoc || userDoc.status === 'blocked') {
          return res.status(403).json({ success: false, message: 'Your account has been blocked' });
        }
        if (userDoc.currentSessionId && decoded.sessionId && userDoc.currentSessionId !== decoded.sessionId) {
          encounteredSessionConflict = true;
          continue;
        }
      }

      req.user = decoded;
      req.token = token;
      return next();
    } catch (err) {
      // Continue to next token
    }
  }

  if (encounteredSessionConflict) {
    return res.status(401).json({ success: false, message: 'SESSION_CONFLICT' });
  }

  return res.status(401).json({ success: false, message: 'Invalid token' });
};
