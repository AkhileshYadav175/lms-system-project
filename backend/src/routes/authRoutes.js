import express from 'express';
import { adminLogin, studentLogin, studentRegister, logout } from '../controllers/authController.js';
import { verifyAdminGateway, allowBridgeOrAdmin } from '../middleware/adminSecurityMiddleware.js';

const router = express.Router();

router.post('/admin-login', verifyAdminGateway, adminLogin);
router.post('/student-login', studentLogin);
router.post('/student-register', allowBridgeOrAdmin, studentRegister);
router.post('/logout', logout);

export default router;
