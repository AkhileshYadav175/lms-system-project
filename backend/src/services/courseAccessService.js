import CourseAccess from '../models/CourseAccess.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';

// Fast in-memory cache for course access checks to accelerate video streaming and repeated page loads
// Map<"studentId:courseId", { result: { hasAccess, reason, accessRecord }, cachedAt }>
const accessCache = new Map();
const ACCESS_CACHE_TTL_MS = 30 * 1000; // 30 seconds

export const invalidateCourseAccessCache = (studentId, courseId) => {
  if (studentId && courseId) {
    accessCache.delete(`${studentId}:${courseId}`);
  } else if (studentId) {
    for (const key of accessCache.keys()) {
      if (key.startsWith(`${studentId}:`)) {
        accessCache.delete(key);
      }
    }
  } else {
    accessCache.clear();
  }
};

export const hasCourseAccess = async (studentId, courseId) => {
  const cacheKey = `${studentId}:${courseId}`;
  const nowMs = Date.now();
  const cached = accessCache.get(cacheKey);

  if (cached && (nowMs - cached.cachedAt < ACCESS_CACHE_TTL_MS)) {
    return cached.result;
  }

  try {
    // Run student, course, and access checks in parallel for maximum speed
    const [student, course, access] = await Promise.all([
      Student.findById(studentId).select('_id status').lean(),
      Course.findById(courseId).select('_id status').lean(),
      CourseAccess.findOne({ studentId, courseId }).lean()
    ]);

    if (!student) {
      const result = { hasAccess: false, reason: 'STUDENT_NOT_FOUND' };
      return result;
    }
    if (student.status !== 'active') {
      const result = { hasAccess: false, reason: 'STUDENT_BLOCKED' };
      return result;
    }

    if (!course) {
      const result = { hasAccess: false, reason: 'COURSE_NOT_FOUND' };
      return result;
    }

    if (!access) {
      const result = { hasAccess: false, reason: 'ACCESS_NOT_FOUND' };
      return result;
    }
    if (access.status === 'revoked') {
      const result = { hasAccess: false, reason: 'ACCESS_REVOKED' };
      return result;
    }

    const now = new Date();
    if (now < new Date(access.startDate)) {
      const result = { hasAccess: false, reason: 'ACCESS_NOT_STARTED' };
      return result;
    }
    
    // Set expiry to the very end of the expiryDate day
    const expiry = new Date(access.expiryDate);
    expiry.setHours(23, 59, 59, 999);
    if (now > expiry) {
      const result = { hasAccess: false, reason: 'ACCESS_EXPIRED' };
      return result;
    }

    const result = { hasAccess: true, reason: null, accessRecord: access };
    accessCache.set(cacheKey, { result, cachedAt: nowMs });
    return result;
  } catch (error) {
    console.error("Error checking course access:", error);
    return { hasAccess: false, reason: 'INTERNAL_ERROR' };
  }
};
