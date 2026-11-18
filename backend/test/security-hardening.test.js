import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { app } from '../src/server.js';
import Admin from '../src/models/Admin.js';
import Student from '../src/models/Student.js';
import { assertRequiredSecrets, getJwtSecret, safeEqual } from '../src/config/secrets.js';
import { encryptPassword, decryptPassword } from '../src/utils/passwordVault.js';

const registerPayload = {
  enrollmentNumber: 'JC-2026-777',
  name: 'Provisioned Student',
  phone: '9123456780',
  password: 'initialPass123',
};

describe('Security hardening', () => {
  let adminToken;
  let student;
  let studentToken;

  beforeEach(async () => {
    const hash = await bcrypt.hash('password123', 10);
    const admin = await Admin.create({ email: 'sec-admin@test.com', password: hash });
    adminToken = jwt.sign({ role: 'admin', userId: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    student = await Student.create({
      studentId: 'STU-SEC-77',
      name: 'Hardening Student',
      phone: '9876501234',
      password: hash,
      status: 'active',
      currentSessionId: 'session-original',
    });
    studentToken = jwt.sign(
      { role: 'student', userId: student._id, sessionId: 'session-original' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('student provisioning (/api/auth/student-register)', () => {
    it('rejects the public admin gateway token as a credential', async () => {
      const res = await request(app)
        .post('/api/auth/student-register')
        .set('x-admin-gateway', process.env.ADMIN_GATEWAY_TOKEN)
        .set('x-admin-gateway-token', process.env.ADMIN_GATEWAY_TOKEN)
        .send(registerPayload);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('REGISTRATION_DISABLED');
      expect(await Student.findOne({ enrollmentNumber: 'JC-2026-777' })).toBeNull();
    });

    it('rejects a wrong ERP bridge key', async () => {
      const res = await request(app)
        .post('/api/auth/student-register')
        .set('x-api-key', 'wrong-key')
        .send(registerPayload);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('REGISTRATION_DISABLED');
    });

    it('rejects a logged-in student trying to create accounts', async () => {
      const res = await request(app)
        .post('/api/auth/student-register')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(registerPayload);

      expect(res.status).toBe(403);
      expect(await Student.findOne({ enrollmentNumber: 'JC-2026-777' })).toBeNull();
    });

    it('allows the ERP bridge key', async () => {
      const res = await request(app)
        .post('/api/auth/student-register')
        .set('x-api-key', process.env.ERP_API_KEY)
        .send(registerPayload);

      expect(res.status).toBe(201);
    });

    it('allows an authenticated admin', async () => {
      const res = await request(app)
        .post('/api/auth/student-register')
        .set('Cookie', [`admin_token=${adminToken}`])
        .send(registerPayload);

      expect(res.status).toBe(201);
    });

    it('does not store a plain-text password for provisioned students', async () => {
      await request(app)
        .post('/api/auth/student-register')
        .set('x-api-key', process.env.ERP_API_KEY)
        .send(registerPayload);

      const raw = await Student.collection.findOne({ enrollmentNumber: 'JC-2026-777' });
      expect(raw.plainPassword).toBeUndefined();
      expect(raw.passwordEnc).not.toContain('initialPass123');
      expect(decryptPassword(raw.passwordEnc)).toBe('initialPass123');
      expect(await bcrypt.compare('initialPass123', raw.password)).toBe(true);
    });
  });

  describe('admin student management', () => {
    it('stores the generated password only encrypted, and shows it on the admin detail page', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Cookie', [`admin_token=${adminToken}`])
        .send({ name: 'Fresh Student', phone: '9000011111' });

      expect(res.status).toBe(201);
      expect(res.body.password).toMatch(/^[0-9a-f]{8}$/);

      const raw = await Student.collection.findOne({ studentId: res.body.studentId });
      expect(raw.plainPassword).toBeUndefined();
      expect(raw.passwordEnc).toMatch(/^v1:/);
      expect(raw.passwordEnc).not.toContain(res.body.password);

      const detail = await request(app).get(`/api/students/${raw._id}`).set('Cookie', [`admin_token=${adminToken}`]);
      expect(detail.body.plainPassword).toBe(res.body.password);
      expect(detail.body.passwordEnc).toBeUndefined();
    });

    it('shows legacy passwords on the detail page but never leaks hashes or passwords in the list', async () => {
      await Student.collection.updateOne({ _id: student._id }, { $set: { plainPassword: 'legacy-secret' } });

      const one = await request(app).get(`/api/students/${student._id}`).set('Cookie', [`admin_token=${adminToken}`]);
      const list = await request(app).get('/api/students').set('Cookie', [`admin_token=${adminToken}`]);

      expect(one.status).toBe(200);
      expect(one.body.plainPassword).toBe('legacy-secret');
      expect(one.body.password).toBeUndefined();
      expect(JSON.stringify(list.body)).not.toContain('legacy-secret');
      expect(JSON.stringify(list.body)).not.toContain('passwordEnc');
    });

    it('does not show the password to non-admins', async () => {
      const res = await request(app).get(`/api/students/${student._id}`).set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('ignores fields that are not editable (mass-assignment protection)', async () => {
      const res = await request(app)
        .put(`/api/students/${student._id}`)
        .set('Cookie', [`admin_token=${adminToken}`])
        .send({ name: 'Renamed', studentId: 'HIJACK', currentSessionId: 'attacker', isErpVerified: true });

      expect(res.status).toBe(200);
      const raw = await Student.collection.findOne({ _id: student._id });
      expect(raw.name).toBe('Renamed');
      expect(raw.studentId).toBe('STU-SEC-77');
      expect(raw.currentSessionId).toBe('session-original');
      expect(raw.isErpVerified).toBe(false);
    });

    it('rejects an invalid status value', async () => {
      const res = await request(app)
        .put(`/api/students/${student._id}`)
        .set('Cookie', [`admin_token=${adminToken}`])
        .send({ status: 'superuser' });

      expect(res.status).toBe(400);
    });

    it('password reset encrypts the new password, removes the legacy copy and signs the student out', async () => {
      await Student.collection.updateOne({ _id: student._id }, { $set: { plainPassword: 'legacy-secret' } });

      const before = await request(app).get('/api/student/dashboard').set('Authorization', `Bearer ${studentToken}`);
      expect(before.status).toBe(200);

      const res = await request(app)
        .put(`/api/students/${student._id}`)
        .set('Cookie', [`admin_token=${adminToken}`])
        .send({ password: 'brandNewPass9' });
      expect(res.status).toBe(200);

      const raw = await Student.collection.findOne({ _id: student._id });
      expect(raw.plainPassword).toBeUndefined();
      expect(decryptPassword(raw.passwordEnc)).toBe('brandNewPass9');
      expect(await bcrypt.compare('brandNewPass9', raw.password)).toBe(true);

      const detail = await request(app).get(`/api/students/${student._id}`).set('Cookie', [`admin_token=${adminToken}`]);
      expect(detail.body.plainPassword).toBe('brandNewPass9');

      const after = await request(app).get('/api/student/dashboard').set('Authorization', `Bearer ${studentToken}`);
      expect(after.status).toBe(401);

      const login = await request(app)
        .post('/api/auth/student-login')
        .send({ studentId: 'STU-SEC-77', password: 'brandNewPass9' });
      expect(login.status).toBe(200);
    });

    it('rejects a too-short password on reset', async () => {
      const res = await request(app)
        .put(`/api/students/${student._id}`)
        .set('Cookie', [`admin_token=${adminToken}`])
        .send({ password: '123' });

      expect(res.status).toBe(400);
    });
  });

  describe('student self-service', () => {
    it('changing own password removes any legacy plain-text copy', async () => {
      await Student.collection.updateOne({ _id: student._id }, { $set: { plainPassword: 'legacy-secret' } });

      const res = await request(app)
        .put('/api/student/password')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ currentPassword: 'password123', newPassword: 'myNewPass123' });

      expect(res.status).toBe(200);
      const raw = await Student.collection.findOne({ _id: student._id });
      expect(raw.plainPassword).toBeUndefined();
      expect(decryptPassword(raw.passwordEnc)).toBe('myNewPass123');
    });

    it('dashboard exposes createdAt for the free-access countdown', async () => {
      const res = await request(app).get('/api/student/dashboard').set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(new Date(res.body.createdAt).getTime()).toBe(new Date(student.createdAt).getTime());
    });
  });

  describe('password vault', () => {
    it('round-trips and uses a fresh IV every time', () => {
      const a = encryptPassword('Secret#123');
      const b = encryptPassword('Secret#123');
      expect(a).not.toBe(b);
      expect(decryptPassword(a)).toBe('Secret#123');
    });

    it('returns null for tampered, foreign-key or empty values', () => {
      const enc = encryptPassword('Secret#123');
      const parts = enc.split(':');
      parts[3] = Buffer.from('tampered').toString('base64');
      expect(decryptPassword(parts.join(':'))).toBeNull();

      const saved = process.env.PASSWORD_VIEW_KEY;
      process.env.PASSWORD_VIEW_KEY = 'another-key';
      expect(decryptPassword(enc)).toBeNull();
      if (saved === undefined) delete process.env.PASSWORD_VIEW_KEY;
      else process.env.PASSWORD_VIEW_KEY = saved;

      expect(decryptPassword('')).toBeNull();
      expect(decryptPassword('not-encrypted')).toBeNull();
      expect(encryptPassword('')).toBeUndefined();
    });
  });

  describe('secret configuration', () => {
    const saved = {};
    const keys = ['NODE_ENV', 'VITEST', 'JWT_SECRET', 'ERP_API_KEY', 'ADMIN_GATEWAY_TOKEN'];

    beforeEach(() => keys.forEach((k) => (saved[k] = process.env[k])));
    afterEach(() =>
      keys.forEach((k) => {
        if (saved[k] === undefined) delete process.env[k];
        else process.env[k] = saved[k];
      })
    );

    it('fails fast outside tests when a secret is missing', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.VITEST;
      delete process.env.JWT_SECRET;

      expect(() => assertRequiredSecrets()).toThrow(/JWT_SECRET/);
      expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);
    });

    it('passes when all secrets are present', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.VITEST;

      expect(() => assertRequiredSecrets()).not.toThrow();
    });

    it('rejects tokens signed with the old hard-coded default secret', async () => {
      const forged = jwt.sign({ role: 'admin', userId: student._id }, 'default_jwt_secret');
      const res = await request(app).get('/api/students').set('Authorization', `Bearer ${forged}`);

      expect(res.status).toBe(401);
    });

    it('safeEqual compares strings correctly', () => {
      expect(safeEqual('abc', 'abc')).toBe(true);
      expect(safeEqual('abc', 'abd')).toBe(false);
      expect(safeEqual('abc', 'abcd')).toBe(false);
      expect(safeEqual(undefined, 'abc')).toBe(false);
    });
  });
});
