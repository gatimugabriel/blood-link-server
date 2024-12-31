import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserTokenDto } from "../../application/dtos/userDto";
import { AuthService } from "../../application/services/authService";
import { Token } from "../../domain/entity/User";
import { UserRepository } from "../../infrastructure/repositories/userRepository";
import { ExtendedRequest } from "../../types/custom";
import { encryptPayload } from "../../utils/encryption";

export class AuthController {
    private readonly authService: AuthService;
    private readonly userRepo: UserRepository;

    constructor() {
        const userRepository = new UserRepository();
        this.authService = new AuthService(userRepository);
        this.userRepo = userRepository
    }

    async signup(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await this.authService.createUser(req.body);

            // create credentials 
            const payload = {
                userID: user.id,
                userRole: user.role,
                email: user.email
            }
            const encryptedPayload = encryptPayload(payload);

            const accessToken = jwt.sign({ data: encryptedPayload }, process.env["JWT_SECRET_ACCESS_TOKEN"] as string, { expiresIn: "5s" });
            const refreshToken = jwt.sign({ data: encryptedPayload }, process.env["JWT_SECRET_REFRESH_TOKEN"] as string, { expiresIn: "30s" });

            // --- save refresh token to DB ---//
            const tokenData: UserTokenDto = {
                userID: user.id,
                token: refreshToken,
                type: "refresh"
            }
            const token = new Token();
            Object.assign(token, tokenData);
            await this.userRepo.saveUserToken(token);

            // set http-only cookies
            res.cookie('accessToken', accessToken, {
                httpOnly: true, sameSite: 'strict', path: '/', secure: process.env.NODE_ENV === "production",
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true, sameSite: 'strict', path: '/', secure: process.env.NODE_ENV === "production",
            });


            res.status(201).json({ user, accessToken, refreshToken });
        } catch (error) {
            next(error)
        }
    }

    async requestMobileVerification(req: Request, res: Response, next: NextFunction) {
        try {
            // const user = await this.authService.requestMobileVerification(req.body);
            res.status(201).send("12345");
        } catch (error) {
            next(error)
        }
    }


    async verifyMobileCode(req: Request, res: Response, next: NextFunction) {
        try {
            // const user = await this.authService.verifyMobileCode(req.body);
            res.status(200).send("Verified");
        } catch (error) {
            next(error)
        }
    }

    async signin(req: Request, res: Response, next: NextFunction) {
        try {
            const { accessToken, refreshToken } = await this.authService.authenticateUser(req.body);
            // set http-only cookies
            res.cookie('accessToken', accessToken, {
                httpOnly: true, sameSite: 'strict', path: '/', secure: process.env.NODE_ENV === "production",
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true, sameSite: 'strict', path: '/', secure: process.env.NODE_ENV === "production",
            });

            res.json({ accessToken, refreshToken });
        } catch (error) {
            next(error);
        }
    }

    async signout(req: ExtendedRequest, res: Response, next: NextFunction) {
        const { refreshToken } = req.body
        const { user } = req

        try {
            // --- remove refresh token from DB --- //
            await this.authService.clearAuthCredentials(user?.userID as string, refreshToken);
            // clear tokens in http-only cookies
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            res.status(200).json({ message: "Signed out!" });
        } catch (error) {
            next(error);
        }
    }

    async refreshToken(req: ExtendedRequest, res: Response, next: NextFunction) {
        const { user } = req
        const userID = user?.userID as string
        const tokenString = req.cookies['refreshToken'] || req.body.refreshToken;

        try {
            const refreshToken = await this.authService.getAuthCredentials(userID, tokenString, "refresh");
            if (!refreshToken) {
                next(new Error("Invalid refresh token"));
            }

            const payload = {
                userID,
                userRole: user?.userRole,
                email: user?.email
            }
            const encryptedPayload = encryptPayload(payload)

            // --- create a new access token  --- //
            const accessToken = jwt.sign({ data: encryptedPayload }, process.env["JWT_SECRET_ACCESS_TOKEN"] as string, { expiresIn: "15m" });
            res.clearCookie('accessToken')
            res.cookie('accessToken', accessToken, {
                httpOnly: true, sameSite: 'strict', path: '/', secure: process.env.NODE_ENV === "production",
            });
            res.status(200).json({ accessToken });
        } catch (error) {           
            next(error);
        }
    }
}
