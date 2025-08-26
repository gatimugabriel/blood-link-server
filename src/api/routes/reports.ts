import { Router } from "express";
import { ReportController } from "../controller/reportController";
import { authenticate } from "../middleware/auth/auth.middleware";
import { hasRoles } from "../middleware/auth/role.middleware";

const router = Router();
const reportController = new ReportController();

router.use(authenticate);
router.use(hasRoles(['ADMIN'])); // only admin access

// Dashboard statistics
router.get('/dashboard', reportController.getDashboardStats.bind(reportController));

// Blood type analysis
router.get('/blood-types', reportController.getBloodTypeReport.bind(reportController));

// Trend analysis
router.get('/trends', reportController.getTrendReport.bind(reportController));

// Urgency analysis
router.get('/urgency', reportController.getUrgencyReport.bind(reportController));

// Data export
router.get('/export', reportController.exportData.bind(reportController));

export default router;