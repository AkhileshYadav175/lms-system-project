import express from "express";
import { getDashboardStats, changeAdminPassword } from "../controllers/adminController.js";
import { markAttendance, getAdminAttendanceOverview, getStudentAttendanceReport } from "../controllers/attendanceController.js";
import { getAttendanceGeofence, updateAttendanceGeofence } from "../controllers/geofenceController.js";
import { verifyAdmin } from "../middleware/authMiddleware.js";
import { verifyAdminGateway, recordHoneypotProbe } from "../middleware/adminSecurityMiddleware.js";

const router = express.Router();

// Public Honeypot endpoint for decoy traps (logs probe attempts)
router.post("/trap", recordHoneypotProbe);

// Protected admin routes: dual-layer Gateway Signature + Admin Token verification
router.use(verifyAdminGateway);
router.get("/dashboard-stats", verifyAdmin, getDashboardStats);
router.put("/change-password", verifyAdmin, changeAdminPassword);
router.get("/attendance", verifyAdmin, getAdminAttendanceOverview);
router.get("/attendance/report", verifyAdmin, getStudentAttendanceReport);
router.post("/attendance/mark", verifyAdmin, markAttendance);
router.get("/attendance/geofence", verifyAdmin, getAttendanceGeofence);
router.put("/attendance/geofence", verifyAdmin, updateAttendanceGeofence);

export default router;
