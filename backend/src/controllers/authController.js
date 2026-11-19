import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Admin from '../models/Admin.js';
import Student from '../models/Student.js';
import { invalidateUserSessionCache } from '../middleware/authMiddleware.js';

const generateTokenAndSetCookie = (res, payload) => {
  const secret = process.env.JWT_SECRET || 'default_jwt_secret';
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });
  
  const cookieName = payload.role === 'admin' ? 'admin_token' : 'student_token';
  
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  return token;
};

// Spaces in passwords are ignored: try exact (old passwords), then with all whitespace removed
const comparePassword = async (input, hash) => {
  const pwd = String(input);
  if (await bcrypt.compare(pwd, hash)) return true;
  const stripped = pwd.replace(/\s+/g, '');
  return stripped !== pwd && bcrypt.compare(stripped, hash);
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const admin = await Admin.findOne({
      email: { $regex: `^${String(email).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const sessionId = crypto.randomUUID();
    
    if (!admin.activeSessions) {
      admin.activeSessions = [];
    }
    
    // Fallback: If they have a currentSessionId but no activeSessions yet, migrate it
    if (admin.currentSessionId && admin.activeSessions.length === 0) {
      admin.activeSessions.push(admin.currentSessionId);
    }

    admin.activeSessions.push(sessionId);
    
    // Keep only the last 3 sessions
    if (admin.activeSessions.length > 3) {
      admin.activeSessions = admin.activeSessions.slice(-3);
    }
    
    admin.currentSessionId = sessionId; // keep for backward compatibility just in case
    await admin.save();
    invalidateUserSessionCache(admin._id);

    const token = generateTokenAndSetCookie(res, { role: 'admin', userId: admin._id, sessionId });
    res.status(200).json({ success: true, message: 'Admin logged in successfully', token });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const studentLogin = async (req, res) => {
  try {
    const { studentId, password } = req.body;
    if (!studentId || !password) return res.status(400).json({ error: 'Student ID and password are required' });

    const cleanId = String(studentId).trim();
    const escaped = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const student = await Student.findOne({ studentId: { $regex: `^${escaped}$`, $options: 'i' } });
    if (!student) return res.status(401).json({ error: 'Invalid credentials' });
    if (student.status === 'blocked') return res.status(403).json({ error: 'Your account has been blocked' });

    let isMatch = await comparePassword(password, student.password);
    if (!isMatch && student.plainPassword) {
      // Old password saved with spaces: accept if it matches ignoring spaces, then fix the stored hash
      const strip = (v) => String(v).replace(/\s+/g, '');
      if (strip(student.plainPassword) === strip(password)) {
        isMatch = true;
        student.password = await bcrypt.hash(strip(password), 10);
        student.plainPassword = strip(password);
      }
    }
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const sessionId = crypto.randomUUID();
    student.currentSessionId = sessionId;
    await student.save();
    invalidateUserSessionCache(student._id);

    const token = generateTokenAndSetCookie(res, { role: 'student', userId: student._id, sessionId });
    res.status(200).json({ success: true, message: 'Student logged in successfully', token });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const logout = (req, res) => {
  res.cookie('admin_token', '', { maxAge: 0, path: '/' });
  res.cookie('student_token', '', { maxAge: 0, path: '/' });
  res.cookie('token', '', { maxAge: 0, path: '/' });
  res.status(200).json({ success: true });
};
