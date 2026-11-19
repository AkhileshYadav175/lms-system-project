import mongoose from "mongoose";

// Singleton document (key: "default") holding the office location used to restrict self punch in/out.
const AttendanceGeofenceSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    enabled: { type: Boolean, default: false },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null },
    radiusMeters: { type: Number, min: 10, max: 5000, default: 100 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

export default mongoose.models.AttendanceGeofence ||
  mongoose.model("AttendanceGeofence", AttendanceGeofenceSchema);
