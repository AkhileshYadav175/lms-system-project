import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import Admin from '../src/models/Admin.js';
import Student from '../src/models/Student.js';
import bcrypt from 'bcryptjs';

describe('Admin Security Middleware & Gateway Protection', () => {
  let admin, student;
  const GATEWAY_TOKEN = process.env.ADMIN_GATEWAY_TOKEN;

  beforeEach(async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    admin = await Admin.create({
      email: 'admin-sec@test.com',
      password: hash,
    });

    student = await Student.create({
      studentId: 'STU-SEC-01',
      name: 'Security Test Student',
      phone: '9876543210',
      password: hash,
      status: 'active',
    });
  });

  it('should block admin login if gateway token is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/admin-login')
      .set('x-admin-gateway-token', 'wrong-malicious-token')
      .send({ email: 'admin-sec@test.com', password: 'password123' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Admin Gateway signature');
  });

  it('should allow admin login when valid gateway token is provided', async () => {
    const res = await request(app)
      .post('/api/auth/admin-login')
      .set('x-admin-gateway-token', GATEWAY_TOKEN)
      .send({ email: 'admin-sec@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should allow student login without any gateway token', async () => {
    const res = await request(app)
      .post('/api/auth/student-login')
      .send({ studentId: 'STU-SEC-01', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should accept honeypot telemetry trap reporting without failure', async () => {
    const res = await request(app)
      .post('/api/admin/trap')
      .send({
        targetPath: '/admin/login',
        userAgent: 'Automated-Vulnerability-Scanner/1.0',
        referrer: 'http://malicious-probe.com',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

