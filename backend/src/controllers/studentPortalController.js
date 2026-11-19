import CourseAccess from '../models/CourseAccess.js';
import Video from '../models/Video.js';
import { hasCourseAccess } from '../services/courseAccessService.js';
import Course from '../models/Course.js';
import Student from '../models/Student.js';
import bcrypt from 'bcryptjs';
import { invalidateUserSessionCache } from '../middleware/authMiddleware.js';

export const getMyDashboard = async (req, res) => {
  try {
    const studentId = req.user.userId;
    
    // Fetch student info and course count in parallel using lean queries
    const [student, assignedCoursesCount] = await Promise.all([
      Student.findById(studentId).select('name studentId phone status').lean(),
      CourseAccess.countDocuments({ studentId })
    ]);

    if (!student || student.status !== 'active') {
      return res.status(403).json({ error: 'Your account is currently inactive.' });
    }

    res.status(200).json({
      name: student.name,
      studentId: student.studentId,
      phone: student.phone,
      status: student.status,
      assignedCoursesCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

export const getMyCourses = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const student = await Student.findById(studentId).select('_id status').lean();
    if (!student || student.status !== 'active') {
      return res.status(403).json({ error: 'Your account is currently inactive.' });
    }

    const now = new Date();

    const accessRecords = await CourseAccess.find({
      studentId,
      status: 'active',
      startDate: { $lte: now }
    }).populate('courseId').lean();

    const accessibleCourses = accessRecords.filter(record => {
      // Expiry logic
      const expiry = new Date(record.expiryDate);
      expiry.setHours(23, 59, 59, 999);
      if (now > expiry) return false;

      // Course must exist
      if (!record.courseId) return false;

      return true;
    }).map(record => ({
      _id: record.courseId._id,
      name: record.courseId.name,
      description: record.courseId.description,
      thumbnail: record.courseId.thumbnail,
      status: record.courseId.status,
      expiryDate: record.expiryDate,
      videoCount: 0
    }));

    // Batch aggregate video counts for ALL courses in a SINGLE query instead of an N+1 loop
    if (accessibleCourses.length > 0) {
      const courseIds = accessibleCourses.map(c => c._id);
      const videoCounts = await Video.aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $group: { _id: "$courseId", count: { $sum: 1 } } }
      ]);
      const countMap = new Map(videoCounts.map(item => [item._id.toString(), item.count]));
      for (const course of accessibleCourses) {
        course.videoCount = countMap.get(course._id.toString()) || 0;
      }
    }

    res.status(200).json(accessibleCourses);
  } catch (error) {
    console.error("Error fetching student courses:", error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

export const getCourseDetails = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { courseId } = req.params;

    const accessCheck = await hasCourseAccess(studentId, courseId);
    if (!accessCheck.hasAccess) {
      return res.status(403).json({ error: accessCheck.reason });
    }

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const courseObj = { ...course };
    if (accessCheck.accessRecord) {
      courseObj.expiryDate = accessCheck.accessRecord.expiryDate;
    }
    res.status(200).json(courseObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch course details' });
  }
};

export const getCourseVideos = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { courseId } = req.params;

    const accessCheck = await hasCourseAccess(studentId, courseId);
    if (!accessCheck.hasAccess) {
      return res.status(403).json({ error: accessCheck.reason });
    }

    const videos = await Video.find({ courseId }).sort({ createdAt: -1 }).lean();
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch course videos' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const studentId = req.user.userId;
    let { currentPassword, newPassword } = req.body;
    if (typeof newPassword === 'string') newPassword = newPassword.replace(/\s+/g, '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const student = await Student.findById(studentId);
    if (!student || student.status !== 'active') {
      return res.status(403).json({ error: 'Your account is currently inactive' });
    }

    const isMatch = (await bcrypt.compare(currentPassword, student.password)) || (await bcrypt.compare(String(currentPassword).replace(/\s+/g, ''), student.password));
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    student.password = hashedPassword;
    student.plainPassword = newPassword;
    await student.save();

    invalidateUserSessionCache(studentId);

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
};
