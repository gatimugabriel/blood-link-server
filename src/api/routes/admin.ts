import { Router } from "express";
import { DonationAdminController } from "../controller/donationAdminController";
import { authenticate } from "../middleware/auth/auth.middleware";
import { isAdmin } from "../middleware/auth/role.middleware";
import { AuthController } from "../controller/authController";

const router = Router();
const controller = new DonationAdminController();
const authController = new AuthController();

router.post('/signin', authController.adminLogin.bind(authController))

router.use(authenticate);
router.use(isAdmin);

router.get('/donations', controller.getAllDonations.bind(controller));
router.get('/donations/:id', controller.getDonation.bind(controller));
router.get('/reports/stats', controller.getDonationStats.bind(controller));
router.patch('/donations/:id', controller.updateDonationStatus.bind(controller));
router.get('/reports/export', controller.exportDonations.bind(controller));

export default router;