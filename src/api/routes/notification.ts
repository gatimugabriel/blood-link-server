import { Router } from "express";
import { NotificationController } from "../controller/notificationController";
import { authenticate } from "../middleware/auth/auth.middleware";

const router = Router();
const controller = new NotificationController();

router.use(authenticate);

router.post("/", controller.sendNotifications.bind(controller));
router.get("/", controller.getUserNotifications.bind(controller));
router.get("/:id", controller.getNotification.bind(controller))
router.patch("/:id/read", controller.markAsRead.bind(controller));
router.delete("/:id", controller.deleteNotification.bind(controller));

export default router; 