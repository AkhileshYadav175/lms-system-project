import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },
    assignedCourses: {
      type: [String], // Temporarily Strings until Course model is ready
      default: [],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    // Encrypted copy of the current password (AES-256-GCM, see utils/passwordVault.js) so the
    // admin panel can show it. Never returned by normal queries; login uses the bcrypt hash.
    passwordEnc: {
      type: String,
      select: false,
    },
    // Legacy plain-text copy from older versions. No longer written; migrated into passwordEnc
    // by scripts/encrypt-plain-passwords.js and still shown to admins until then.
    plainPassword: {
      type: String,
      select: false,
    },
    currentSessionId: {
      type: String,
      default: "",
    },
    enrollmentNumber: {
      type: String,
      sparse: true,
      index: true,
      default: null,
    },
    isErpVerified: {
      type: Boolean,
      default: false,
    },
    fatherName: {
      type: String,
      default: "",
    },
    batch: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

StudentSchema.index({ status: 1 });
StudentSchema.index({ createdAt: -1 });

export default mongoose.models.Student || mongoose.model("Student", StudentSchema);
