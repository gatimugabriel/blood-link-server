import {Router} from "express";
import {DonationAdminController} from "../controller/donationAdminController";
import {AuthController} from "../controller/authController";

const router = Router();
const controller = new DonationAdminController();
const authController = new AuthController();

router.post('/signin', authController.adminLogin.bind(authController))

// router.use(authenticate);
// router.use(isAdmin);

/* --------- Reports & Statistics --------- */
router.get('/reports/stats', controller.getDonationStats.bind(controller));
router.get('/reports/export', controller.exportDonations.bind(controller));

export default router;