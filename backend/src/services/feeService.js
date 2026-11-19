import FeeRecord from '../models/FeeRecord.js';
import Student from '../models/Student.js';
import { fetchStudentFeeDetails } from './erp/httpAdapter.js';

/**
 * Background / Real-time Fee Sync Job
 * Syncs real-time fee details from ERP bridge into local LMS FeeRecord
 */
export const processFeeSyncJob = async ({ studentId, enrollmentNumber }) => {
  if (!studentId) {
    console.warn('[FEE_SYNC_JOB] Missing studentId, skipping sync');
    return null;
  }

  try {
    let targetEnrollment = enrollmentNumber;
    if (!targetEnrollment) {
      const student = await Student.findById(studentId).select('studentId enrollmentNumber').lean();
      targetEnrollment = student?.enrollmentNumber || student?.studentId;
    }

    if (!targetEnrollment) {
      console.warn(`[FEE_SYNC_JOB] Student ${studentId} has no enrollment number, skipping sync`);
      return null;
    }

    const feeData = await fetchStudentFeeDetails({ enrollmentNumber: targetEnrollment });
    if (!feeData) return null;

    const totalAmount = Number(feeData.totalAmount || 0);
    const paidAmount = Number(feeData.paidAmount || 0);
    const dueAmount = Number(feeData.dueAmount ?? Math.max(0, totalAmount - paidAmount));
    const dueDate = feeData.dueDate || null;
    const feeStatus = feeData.feeStatus || (dueAmount > 0 ? (paidAmount > 0 ? 'partially_paid' : 'pending') : 'paid');

    const updatePayload = {
      studentId,
      enrollmentNumber: targetEnrollment,
      totalAmount,
      paidAmount,
      dueAmount,
      dueDate,
      feeStatus,
      installments: Array.isArray(feeData.installments) ? feeData.installments : [],
      lastSyncedAt: new Date(),
    };

    const feeRecord = await FeeRecord.findOneAndUpdate(
      { studentId },
      updatePayload,
      { upsert: true, returnDocument: 'after' }
    );

    console.log(`[FEE_SYNC_JOB] ✓ Synced fees for ${targetEnrollment}: Total=₹${totalAmount}, Paid=₹${paidAmount}, Due=₹${dueAmount}, Status=${feeStatus}`);
    return feeRecord;
  } catch (error) {
    console.error(`[FEE_SYNC_JOB] Error syncing fees for student ${studentId}:`, error.message);
    return null;
  }
};

export default {
  processFeeSyncJob,
};
