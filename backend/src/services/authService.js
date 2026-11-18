import bcrypt from 'bcryptjs';
import Student from '../models/Student.js';
import CourseAccess from '../models/CourseAccess.js';
import { AppError } from '../utils/AppError.js';
import { verifyAdmissionRecord } from './erp/httpAdapter.js';
import feeService, { processFeeSyncJob } from './feeService.js';
import { encryptPassword } from '../utils/passwordVault.js';

/**
 * Register a student by cross-verifying with ERP records
 */
export const registerStudent = async ({ enrollmentNumber, name, phone, password, courseIds }) => {
  if (!enrollmentNumber || !phone || !password) {
    throw new AppError('Enrollment number, phone, and password are required', 400);
  }

  const cleanPhone = phone.trim();
  const cleanEnrollment = enrollmentNumber.trim().toUpperCase();

  // 1. Verify admission record against ERP Bridge
  const verification = await verifyAdmissionRecord({
    enrollmentNumber: cleanEnrollment,
    phone: cleanPhone,
  });

  if (!verification || !verification.verified) {
    throw new AppError(
      verification?.message || 'Admission verification failed: Enrollment or phone mismatch with ERP records',
      400
    );
  }

  // 2. Check if already registered in Student database
  const existingStudent = await Student.findOne({
    $or: [
      { enrollmentNumber: cleanEnrollment },
      { studentId: cleanEnrollment },
    ],
  });

  if (existingStudent) {
    throw new AppError('This enrollment number is already registered. Please proceed to login.', 409);
  }

  // 3. Create Student Account
  const studentName = verification.data?.name || name || 'Student';
  const hashedPassword = await bcrypt.hash(password, 10);

  const student = await Student.create({
    studentId: cleanEnrollment,
    enrollmentNumber: cleanEnrollment,
    name: studentName,
    phone: cleanPhone,
    status: 'active',
    password: hashedPassword,
    passwordEnc: encryptPassword(password),
    isErpVerified: true,
    fatherName: verification.data?.fatherName || '',
    batch: verification.data?.batch || verification.data?.courseCode || '',
    assignedCourses: Array.isArray(courseIds) ? courseIds : [],
  });

  // 4. Assign Courses if requested
  if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const accessDocs = courseIds.map(cid => ({
      studentId: student._id,
      courseId: cid,
      startDate,
      expiryDate,
      status: 'active',
    }));

    await CourseAccess.insertMany(accessDocs).catch(err => {
      console.warn('[AUTH_SERVICE] Course access insert warning:', err.message);
    });
  }

  // 5. Trigger Background Fee Sync Job immediately
  setImmediate(() => {
    feeService.processFeeSyncJob({ studentId: student._id, enrollmentNumber: cleanEnrollment })
      .catch(err => console.error('[AUTH_SERVICE] Background fee sync failed:', err.message));
  });

  return {
    success: true,
    message: 'Student account created and verified with ERP successfully',
    studentId: student.studentId,
    name: student.name,
  };
};

export default {
  registerStudent,
};

