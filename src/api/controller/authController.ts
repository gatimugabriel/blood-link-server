import {NextFunction, Request, Response} from "express";
import {UserTokenDto} from "../../application/dtos/userDto";
import {AuthService} from "../../application/services/authService";
import {Token} from "../../domain/entity/User";
import {UserRepository} from "../../domain/repositories/userRepository";
import {ExtendedRequest} from "../../types/custom";
import {generateAuthTokens} from "../../utils/token";
import bcrypt from "bcrypt";

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
            const {accessToken, refreshToken} = generateAuthTokens(user.id, user.role, user.email)

            // --- save refresh token to DB ---//
            const tokenData: UserTokenDto = {
                userID: user.id,
                token: refreshToken,
                type: "refresh"
            }
            const token = new Token();
            Object.assign(token, tokenData);
            await this.userRepo.saveToken(token);

            // set http-only cookies
            res.cookie('accessToken', accessToken, {
                httpOnly: true, sameSite: 'strict', path: '/', secure: process.env.NODE_ENV === "production",
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true, sameSite: 'strict', path: '/', secure: process.env.NODE_ENV === "production",
            });

            res.status(201).json({user, accessToken, refreshToken});
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
            const {accessToken, refreshToken} = await this.authService.authenticateUser(req.body);
            // set http-only cookies
            res.cookie('accessToken', accessToken, {
                httpOnly: true, sameSite: 'strict', path: '/', secure: process.env.NODE_ENV === "production",
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true, sameSite: 'strict', path: '/', secure: process.env.NODE_ENV === "production",
            });

            res.json({accessToken, refreshToken});
        } catch (error) {
            next(error);
        }
    }

    async adminLogin(req: Request, res: Response) {
        const { email, password } = req.body;

        try {
            const user = await this.userRepo.findUser({where: {email}})
            if (!user || (user.role).toUpperCase() !== 'ADMIN') {
                res.status(401)
                res.render('auth/login', {
                    title: 'Admin Login',
                    error: 'Insufficient Permissions. Access denied for this user.'
                });
                return
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                res.status(401)
                res.render('auth/login', {
                    title: 'Admin Login',
                    error: 'Invalid credentials'
                });
                return
            }

            const {accessToken, refreshToken} = generateAuthTokens(user.id, user.role, user.email)

            // Set cookies
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 15 * 60 * 1000
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000
            });

            res.redirect('/admin/donations');
        } catch (error) {
            res.render('admin/auth/login', {
                title: 'Admin Login',
                error: 'An error occurred. Please try again.'
            });
        }
    }

    async signout(req: ExtendedRequest, res: Response, next: NextFunction) {
        const {refreshToken} = req.body
        const token = req.cookies["refreshToken"] || refreshToken
        const {user} = req

        try {
            // --- remove refresh token from DB --- //
            await this.authService.clearAuthCredentials(user?.userID as string, token);
            // clear tokens in http-only cookies
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            res.status(200).json({message: "Signed out!"});
        } catch (error) {
            next(error);
        }
    }

    async refreshToken(req: ExtendedRequest, res: Response, next: NextFunction) {
        const {user} = req
        const userID = user?.userID as string
        const tokenString = req.cookies['refreshToken'] || req.body.refreshToken;

        try {
            const refreshToken = await this.authService.getAuthCredentials(userID, tokenString, "refresh");
            if (!refreshToken) {
                next(new Error("Invalid refresh token"));
            }

            // --- create a new access token  --- //
            const {accessToken} = generateAuthTokens(userID, user?.userRole as string, user?.email)
            res.clearCookie('accessToken')
            res.cookie('accessToken', accessToken, {
                httpOnly: true, sameSite: 'strict', path: '/', secure: process.env.NODE_ENV === "production",
            });
            res.status(200).json({accessToken});
        } catch (error) {
            next(error);
        }
    }
}
