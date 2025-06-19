import { NextFunction, Request, Response } from "express";
import { UserService } from "../../application/services/userService";
import { UserRepository } from "../../domain/repositories/userRepository";
import { users } from "../../infrastructure/database/data/users";
import { ExtendedRequest } from "../../types/custom";

export class UserController {
    private readonly userService: UserService

    constructor() {
        const userRepository = new UserRepository();
        this.userService = new UserService(userRepository)
    }

    async insertManyUsers(req: Request, res: Response, next: NextFunction) {
        try {
            await this.userService.insertManyUsers(users);
            res.status(201).json({ message: "Inserted users" });
        } catch (error) {
            next(error)
        }
    }

    async listUsers(req: Request, res: Response, next: NextFunction) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const latitude = parseFloat(req.query.lat as string);
        const longitude = parseFloat(req.query.long as string);
        const radius = parseFloat(req.query.radius as string) || 150000;
        const sortBy = req.query.sortBy as string || 'createdAt';
        const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'desc';
        const status = req.query.status as string;
        const search = req.query.search as string;
        const bloodGroup = req.query.bloodGroup as string;

        try {
            const [users, total] = await this.userService.listUsers(
                page,
                limit,
                latitude,
                longitude,
                radius,
                sortBy,
                sortOrder,
                status,
                search,
                bloodGroup,
            );


            res.status(200).json({
                data: users,
                pagination: {
                    dataCount: users.length,
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error)
        }
    }

    async getUsersWithinRange(req: Request, res: Response, next: NextFunction) {
        try {
            const { latitude, longitude, radius } = req.body
            console.log(req.body, "req.body");

            const result = await this.userService.getUsersWithinRange(latitude, longitude, radius);
            res.status(201).json({ "result": result });
        } catch (error) {
            next(error)
        }
    }

    async getUser(req: ExtendedRequest, res: Response, next: NextFunction) {
        try {
            const { user } = req
            const data = await this.userService.getUser(user?.userID);
            res.status(200).send(data);
        } catch (error) {
            next(error)
        }
    }

    // Saves user/device token for push notifications
    async saveFcmToken(req: ExtendedRequest, res: Response, next: NextFunction) {
        try {
            const { user } = req
            const { fcmToken } = req.body
            const userId = user?.userID as string
            const data = await this.userService.saveUserToken(userId, fcmToken, "fcm");
            res.status(201).json({ message: "FCM token saved", data });
        } catch (error) {
            next(error)
        }
    }

    async setLocation(req: ExtendedRequest, res: Response, next: NextFunction){
        try{
            console.log("User Location updated")
        }catch (e) {
            console.error(e)
            next(e)
        }
    }
}