import { NextFunction, Request, Response } from "express";
import { UserService } from "../../application/services/userService";
import { UserRepository } from "../../infrastructure/repositories/userRepository";
import {users} from "../../infrastructure/database/data/users";
import {ExtendedRequest} from "../../types/custom";

export class UserController {
    private readonly userService: UserService

    constructor() {
        const userRepository = new UserRepository();
        this.userService = new UserService(userRepository)
    }

     async insertManyUsers(req: Request, res: Response, next: NextFunction) {
        try {
            await this.userService.insertManyUsers(users);
            res.status(201).json({message: "Inserted users"});
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

}
