import { Router } from "express";
import { DataSeedingController } from "../controller/dataSeedingController";

const router = Router();
const controller = new DataSeedingController();

router.post('/seed/users', controller.seedUsers.bind(controller));
router.post('/seed/requests', controller.seedDonationRequests.bind(controller));
router.post('/seed/donations', controller.seedDonations.bind(controller));
router.post('/seed/all', controller.seedAllData.bind(controller));

export default router; 