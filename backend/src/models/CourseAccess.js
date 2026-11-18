import mongoose from "mongoose";

const CourseAccessSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

CourseAccessSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
CourseAccessSchema.index({ studentId: 1, status: 1, startDate: 1, expiryDate: 1 });
CourseAccessSchema.index({ status: 1, expiryDate: 1 });

export default mongoose.models.CourseAccess || mongoose.model("CourseAccess", CourseAccessSchema);
