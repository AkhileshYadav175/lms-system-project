import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Student from '../models/Student.js';
import Counter from '../models/Counter.js';
import CourseAccess from '../models/CourseAccess.js';
import { invalidateUserSessionCache } from '../middleware/authMiddleware.js';
import { encryptPassword, decryptPassword } from '../utils/passwordVault.js';

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password -plainPassword').sort({ createdAt: -1 });
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id).select('-password +passwordEnc +plainPassword').lean();
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Admin detail view shows the student's current password (decrypted; legacy plain copy as fallback)
    const { passwordEnc, plainPassword, ...rest } = student;
    res.status(200).json({ ...rest, plainPassword: decryptPassword(passwordEnc) || plainPassword || '' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { name, phone, password, courseIds } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }

    const prefix = 'STU-JC';

    const counter = await Counter.findByIdAndUpdate(
      prefix,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    const sequenceNumber = String(counter.seq).padStart(3, '0');
    const studentId = `${prefix}${sequenceNumber}`;

    const rawPassword = password || crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const student = await Student.create({
      studentId, name, phone, password: hashedPassword, passwordEnc: encryptPassword(rawPassword), status: 'active', assignedCourses: []
    });

    if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const accessDocs = courseIds.map(cid => ({
        studentId: student._id,
        courseId: cid,
        startDate,
        expiryDate,
        status: 'active'
      }));
      await CourseAccess.insertMany(accessDocs);
      
      // Update student's internal array for admin UI counting
      student.assignedCourses = courseIds;
      await student.save();
    }

    res.status(201).json({ success: true, studentId: student.studentId, password: rawPassword, name: student.name });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create student' });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    // Only these fields may be changed from the admin panel (never sessions, IDs, ERP flags, ...)
    const ALLOWED_FIELDS = ['name', 'phone', 'status', 'password'];
    const updateData = {};
    for (const key of ALLOWED_FIELDS) {
      if (req.body[key] !== undefined && req.body[key] !== '') updateData[key] = req.body[key];
    }

    if (updateData.phone && !/^\d{10}$/.test(updateData.phone)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }
    if (updateData.status && !['active', 'blocked'].includes(updateData.status)) {
      return res.status(400).json({ error: 'Status must be active or blocked' });
    }

    const unset = {};
    if (updateData.password) {
      updateData.password = String(updateData.password).replace(/\s+/g, '');
      if (String(updateData.password).length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      updateData.passwordEnc = encryptPassword(String(updateData.password));
      updateData.password = await bcrypt.hash(String(updateData.password), 10);
      unset.plainPassword = 1; // drop any legacy plain-text copy
      updateData.currentSessionId = crypto.randomUUID(); // invalidates every existing login
    }
    if (updateData.status === 'blocked') updateData.currentSessionId = crypto.randomUUID();

    const update = Object.keys(unset).length ? { $set: updateData, $unset: unset } : updateData;
    const student = await Student.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select('-password -plainPassword');
    if (!student) return res.status(404).json({ error: 'Student not found' });

    invalidateUserSessionCache(id);

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update student' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    invalidateUserSessionCache(id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
};
