import { NextFunction, Request, Response } from "express";
import { UserService } from "../../application/services/userService";
import { UserRepository } from "../../infrastructure/repositories/userRepository";
import { users } from "../../infrastructure/database/data/users";
import { ExtendedRequest } from "../../types/custom";
import { firebaseAdmin } from "../../config/firebase/firebase.config";
import {token} from "morgan";

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
            res.status(200).json({ message: "FCM token saved", data });
        } catch (error) {
            next(error)
        }
    }

    // send push notification
    // async sendPushNotification(req: ExtendedRequest, res: Response, next: NextFunction) {
    //     try {
    //         const { user } = req
    //         const { message } = req.body
    //         const userId = user?.userID as string
    //
    //         //get user and their fcm tokens from database
    //         const [tokens, count] = await this.userService.getUserTokens(userId, "fcm");
    //
    //         const payload = {
    //             notification: {
    //                 title: message.title,
    //                 body: message.subTitle
    //             },
    //             data: {
    //                 type: "DONATION_REQUEST",
    //                 // ...message.body
    //                 location: JSON.stringify(message.body.location)
    //             },
    //             token: tokens[0].token
    //         }
    //
    //         console.log("payload to send", payload)
    //
    //         const data = await firebaseAdmin.messaging().send(payload);
    //         res.status(200).json({ message: "Push notification sent", data });
    //     } catch (error) {
    //         console.log(error)
    //         next(error)
    //     }
    // }

    async sendPushNotification(req: ExtendedRequest, res: Response, next: NextFunction) {
        try {
            const { user } = req
            const { message } = req.body
            const userId = user?.userID as string

            const [tokens, count] = await this.userService.getUserTokens(userId, "fcm");

            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: tokens[1].token,
                    title: message.title,
                    body: message.subTitle,
                    data: {
                        type: "DONATION_REQUEST",
                        location: JSON.stringify(message.body.location)
                    },
                }),
            });

            const data = await response.json();
            res.status(200).json({ message: "Push notification sent", data });
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

}
