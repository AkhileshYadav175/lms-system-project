import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student ID is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Attendance date is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "holiday"],
      default: "present",
    },
    topicCovered: {
      type: String,
      default: "",
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    punchType: {
      type: String,
      enum: ["self", "admin", "biometric"],
      default: "self",
    },
    checkInLocation: {
      latitude: Number,
      longitude: Number,
      distance: Number,
    },
    checkOutLocation: {
      latitude: Number,
      longitude: Number,
      distance: Number,
    },
    checkIn: {
      type: String,
      default: null,
    },
    checkOut: {
      type: String,
      default: null,
    },
    duration: {
      type: String,
      default: null,
    },
    faculty: {
      type: String,
      default: "Neha Jain",
    },
    room: {
      type: String,
      default: "Classroom 2",
    },
    classTime: {
      type: String,
      default: "9:00 – 11:00 AM",
    },
    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.index({ studentId: 1, date: -1 });

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);

