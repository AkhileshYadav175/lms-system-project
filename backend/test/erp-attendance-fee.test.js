import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import Student from '../src/models/Student.js';
import FeeRecord from '../src/models/FeeRecord.js';
import Attendance from '../src/models/Attendance.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('ERP Bridge, Attendance Tracker & Fee Dues Alert', () => {
  let studentToken, studentId, studentDoc;

  beforeEach(async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('secretPass123', salt);

    studentDoc = await Student.create({
      studentId: 'JC-2026-901',
      enrollmentNumber: 'JC-2026-901',
      name: 'Rohan Sharma',
      phone: '9876543210',
      password: hash,
      status: 'active',
      isErpVerified: true,
    });

    studentId = studentDoc._id;
    studentToken = jwt.sign(
      { role: 'student', userId: studentId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('ERP Registration & Login Validation', () => {
    it('should reject public student registration with 403 when gateway token is missing', async () => {
      const res = await request(app)
        .post('/api/auth/student-register')
        .send({
          enrollmentNumber: 'JC-2026-902',
          name: 'Public User',
          phone: '9123456789',
          password: 'securePassword123',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('REGISTRATION_DISABLED');
    });

    it('should reject registration if enrollment verification fails', async () => {
      const res = await request(app)
        .post('/api/auth/student-register')
        .set('x-api-key', process.env.ERP_API_KEY)
        .send({
          enrollmentNumber: 'INVALID-ROLL-999',
          name: 'Fake Student',
          phone: '9000000000',
          password: 'pass1234Password',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('should register student successfully with valid ERP admission', async () => {
      const res = await request(app)
        .post('/api/auth/student-register')
        .set('x-api-key', process.env.ERP_API_KEY)
        .send({
          enrollmentNumber: 'JC-2026-902',
          name: 'Pooja Verma',
          phone: '9123456789',
          password: 'securePassword123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.studentId).toBe('JC-2026-902');

      const saved = await Student.findOne({ enrollmentNumber: 'JC-2026-902' });
      expect(saved).toBeDefined();
      expect(saved.isErpVerified).toBe(true);
    });

    it('should allow student to login with their enrollment number', async () => {
      const res = await request(app)
        .post('/api/auth/student-login')
        .send({
          studentId: 'jc-2026-901', // Lowercase test for case insensitivity
          password: 'secretPass123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should reject duplicate registration with same enrollment number', async () => {
      const res = await request(app)
        .post('/api/auth/student-register')
        .set('x-api-key', process.env.ERP_API_KEY)
        .send({
          enrollmentNumber: 'JC-2026-901',
          name: 'Rohan Sharma Duplicate',
          phone: '9876543210',
          password: 'newPassword123',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already registered');
    });
  });

  describe('Attendance Tracker Module', () => {
    it('should return attendance stats, overall percentage, and monthly breakdown', async () => {
      // Seed 4 classes: 3 present, 1 absent
      const date1 = new Date('2026-11-01');
      const date2 = new Date('2026-11-02');
      const date3 = new Date('2026-11-03');
      const date4 = new Date('2026-11-04');

      await Attendance.create([
        { studentId, date: date1, status: 'present', topicCovered: 'HTML/CSS Basics' },
        { studentId, date: date2, status: 'present', topicCovered: 'JavaScript ES6' },
        { studentId, date: date3, status: 'late', topicCovered: 'React Hooks' },
        { studentId, date: date4, status: 'absent', topicCovered: 'Node Express' },
      ]);

      const res = await request(app)
        .get('/api/student/attendance')
        .set('Cookie', [`student_token=${studentToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.totalClasses).toBe(4);
      expect(res.body.summary.attendedClasses).toBe(3); // 2 present + 1 late
      expect(res.body.summary.overallPercentage).toBe(75);
      expect(res.body.monthlyBreakdown).toBeDefined();
      expect(res.body.records.length).toBe(4);
    });

    it('should allow student to punch attendance for today', async () => {
      const res = await request(app)
        .post('/api/student/attendance/punch')
        .set('Cookie', [`student_token=${studentToken}`])
        .send({ topicCovered: 'Full Stack Lab Work' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.record.status).toBe('present');

      // Verify that getStudentAttendance reflects isPunchedToday: true
      const checkRes = await request(app)
        .get('/api/student/attendance')
        .set('Cookie', [`student_token=${studentToken}`]);

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.isPunchedToday).toBe(true);
    });

    it('should reject duplicate attendance punch on the same day', async () => {
      // First punch
      const res1 = await request(app)
        .post('/api/student/attendance/punch')
        .set('Cookie', [`student_token=${studentToken}`])
        .send();

      expect(res1.status).toBe(201);

      // Duplicate punch attempt
      const res2 = await request(app)
        .post('/api/student/attendance/punch')
        .set('Cookie', [`student_token=${studentToken}`])
        .send();

      expect(res2.status).toBe(400);
      expect(res2.body.success).toBe(false);
      expect(res2.body.error).toContain('already recorded for today');
      expect(res2.body.alreadyPunched).toBe(true);
    });
  });

  describe('Fee Management & Dues Alert Banner', () => {
    it('should return warning severity when fee due is upcoming within 7 days', async () => {
      const now = new Date();
      const dueDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days later

      await FeeRecord.create({
        studentId,
        enrollmentNumber: 'JC-2026-901',
        totalAmount: 10000,
        paidAmount: 6000,
        dueAmount: 4000,
        dueDate,
        feeStatus: 'partially_paid',
      });

      const res = await request(app)
        .get('/api/student/dashboard')
        .set('Cookie', [`student_token=${studentToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.feeAlert).toBeDefined();
      expect(res.body.feeAlert.hasDue).toBe(true);
      expect(res.body.feeAlert.dueAmount).toBe(4000);
      expect(res.body.feeAlert.severity).toBe('warning');
      expect(res.body.feeAlert.message).toContain('due in 4 days');
    });

    it('should return danger severity when fee due is overdue', async () => {
      const now = new Date();
      const dueDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days past

      await FeeRecord.create({
        studentId,
        enrollmentNumber: 'JC-2026-901',
        totalAmount: 12000,
        paidAmount: 5000,
        dueAmount: 7000,
        dueDate,
        feeStatus: 'overdue',
      });

      const res = await request(app)
        .get('/api/student/dashboard')
        .set('Cookie', [`student_token=${studentToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.feeAlert.hasDue).toBe(true);
      expect(res.body.feeAlert.severity).toBe('danger');
      expect(res.body.feeAlert.message).toContain('overdue by 2 days');
    });

    it('should return success state when student has zero dues', async () => {
      await FeeRecord.create({
        studentId,
        enrollmentNumber: 'JC-2026-901',
        totalAmount: 10000,
        paidAmount: 10000,
        dueAmount: 0,
        dueDate: null,
        feeStatus: 'paid',
      });

      const res = await request(app)
        .get('/api/student/dashboard')
        .set('Cookie', [`student_token=${studentToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.feeAlert.hasDue).toBe(false);
      expect(res.body.feeAlert.severity).toBe('success');
    });
  });
});

