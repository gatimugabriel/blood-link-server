import { Request, Response, NextFunction } from "express";
import { DB } from "../../infrastructure/database/data-source";
import { Notification } from "../../domain/entity/Notification";
import { NotificationService } from "../../application/services/notificationService";

export class NotificationController {
    private notificationRepository = DB.getRepository(Notification);
    private notificationService = new NotificationService();

    async getUserNotifications(req: any, res: Response, next: NextFunction) {
        try {
            const userID = req.user?.userID;
            const notifications = await this.notificationRepository.find({
                where: { userID },
                order: { createdAt: "DESC" },
            });
            res.status(200).json({ notifications });
        } catch (error) {
            next(error);
        }
    }

    async markAsRead(req: any, res: Response, next: NextFunction) {
        try {
            const userID = req.user?.userID;
            const { id } = req.params;
            const notification = await this.notificationRepository.findOneBy({ id, userID });
            if (!notification) {
                return res.status(404).json({ message: "Notification not found" });
            }
            notification.status = "read";
            await this.notificationRepository.save(notification);
            res.status(200).json({ message: "Notification marked as read" });
        } catch (error) {
            next(error);
        }
    }

    async sendNotifications(req: any, res: Response, next: NextFunction) {
        try {
            const { recipients, data } = req.body;
            await this.notificationService.sendNotification(recipients, data);
            res.status(201).json({ message: "Notifications sent" });
        } catch (error) {
            next(error);
        }
    }

    async deleteNotification(req: Request, res: Response, next: NextFunction) {
        try {
            const {id} = req.params;
            const notification = await this.notificationRepository.findOneBy({id});
            if (!notification) {
                return res.status(404).json({message: "Notification not found"});
            }
            await this.notificationRepository.remove(notification);
            res.status(200).json({message: "Notification deleted"});
        } catch (error) {
            next(error);
        }
    }
} 