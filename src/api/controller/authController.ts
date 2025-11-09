import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { OAuth2Client } from 'google-auth-library';
import { UserTokenDto } from "../../application/dtos/userDto";
import { AuthService } from "../../application/services/authService";
import { Token } from "../../domain/entity/User";
import { UserRepository } from "../../domain/repositories/userRepository";
import { ExtendedRequest } from "../../types/custom";
import { generateAuthTokens } from "../../utils/token";

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
            const { accessToken, refreshToken } = generateAuthTokens(user.id, user.role, user.email)

            const tokenData: UserTokenDto = {
                userID: user.id,
                token: refreshToken,
                type: "refresh"
            }
            const token = new Token();
            Object.assign(token, tokenData);
            await this.userRepo.saveToken(token);

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                secure: process.env.NODE_ENV === "production",
                maxAge: 15 * 60 * 1000 // 15 minutes
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                secure: process.env.NODE_ENV === "production",
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            res.status(201).json({ user, accessToken, refreshToken });
        } catch (error) {
            next(error)
        }
    }

    async requestMobileVerification(req: Request, res: Response, next: NextFunction) {
        try {
            const verificationCode = await this.authService.requestMobileVerification(req.body);
            res.status(201).json({ message: "Verification code sent", code: verificationCode });
        } catch (error) {
            next(error)
        }
    }

     async requestEmailVerification(req: Request, res: Response, next: NextFunction) {
        try {
            const verificationCode = await this.authService.requestEmailVerification(req.body);
            res.status(201).json({ message: "Verification code sent", code: verificationCode });
        } catch (error) {
            next(error)
        }
    }

    async verifyMobileCode(req: Request, res: Response, next: NextFunction) {
        try {
            const isVerified = await this.authService.verifyCode(req.body);
            if (isVerified) {
                res.status(200).json({ message: "Verification successful" });
            } else {
                res.status(400).json({ message: "Verification failed" });
            }
        } catch (error) {
            next(error)
        }
    }

    async signin(req: Request, res: Response, next: NextFunction) {
        try {
            const { accessToken, refreshToken } = await this.authService.authenticateUser(req.body);
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                secure: process.env.NODE_ENV === "production",
                maxAge: 15 * 60 * 1000 // 15 minutes
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                secure: process.env.NODE_ENV === "production",
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            res.json({ accessToken, refreshToken });
        } catch (error) {
            next(error);
        }
    }

    async adminLogin(req: Request, res: Response) {
        const { email, password } = req.body;

        try {
            const user = await this.userRepo.findUser({ where: { email } })
            if (!user || (user.role).toUpperCase() !== 'ADMIN') {
                res.status(401)
                // res.render('auth/login', {
                //     title: 'Admin Login',
                //     error: 'Insufficient Permissions. Access denied for this user.'
                // });
                res.json({
                    message: 'Insufficient Permissions. Access denied for this user.'
                })
                return
            }

            const isValid = await bcrypt.compareSync(password, user.password);
            if (!isValid) {
                res.status(401)
                // res.render('auth/login', {
                //     title: 'Admin Login',
                //     error: 'Invalid credentials'
                // });
                res.json({
                    message: 'Invalid credentials'
                })
                return
            }

            const { accessToken, refreshToken } = generateAuthTokens(user.id, user.role, user.email)

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            res.json({
                message: 'Login successful',
                accessToken,
                refreshToken
            })
        } catch (error: Error | any) {
            // res.render('admin/auth/login', {
            //     title: 'Admin Login',
            //     error: 'An error occurred. Please try again.'
            // });
            console.error("Admin login error:", error);
            res.status(500).json({
                message: (error as Error).message || 'An error occurred. Please try again.'
            })
        }
    }

    async signout(req: ExtendedRequest, res: Response, next: NextFunction) {
        const { refreshToken } = req.body
        const token = req.cookies["refreshToken"] || refreshToken
        const { user } = req

        try {
            await this.authService.clearAuthCredentials(user?.userID as string, token);
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

            const { accessToken } = generateAuthTokens(userID, user?.userRole as string, user?.email)
            res.clearCookie('accessToken')
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                secure: process.env.NODE_ENV === "production",
                maxAge: 15 * 60 * 1000 // 15 minutes
            });
            res.status(200).json({ accessToken });
        } catch (error) {
            next(error);
        }
    }

    async googleAuth(req: Request, res: Response, next: NextFunction) {
        try {
            const { idToken } = req.body;
            if (!idToken) {
                return res.status(400).json({ error: 'ID token is required' });
            }

            const client = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_OAUTH_CLIENT_ID
            });

            const payload = ticket.getPayload();
            if (!payload) {
                return res.status(400).json({ error: 'Invalid token' });
            }

            const { email, name, picture, given_name, family_name, sub: googleId } = payload;

            const result = await this.authService.authenticateGoogleUser({
                email: email!,
                googleId: googleId!,
                firstName: given_name || name?.split(' ')[0] || '',
                lastName: family_name || name?.split(' ').slice(1).join(' ') || '',
                profilePicture: picture
            });

            if (result.requiresCompletion) {
                return res.status(200).json(result);
            }

            res.cookie('accessToken', result.accessToken, {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                secure: process.env.NODE_ENV === "production",
                maxAge: 15 * 60 * 1000 // 15 minutes
            });
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                secure: process.env.NODE_ENV === "production",
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            res.status(200).json(result);
        } catch (error) {
            console.error('Google auth error:', error);
            next(error);
        }
    }

    async completeGoogleProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const { tempUserData, additionalData } = req.body;
            
            const { user, accessToken, refreshToken } = await this.authService.completeGoogleUserProfile(
                tempUserData,
                additionalData
            );

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                secure: process.env.NODE_ENV === "production",
                maxAge: 15 * 60 * 1000 // 15 minutes
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                secure: process.env.NODE_ENV === "production",
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            res.status(201).json({ user, accessToken, refreshToken });
        } catch (error) {
            next(error);
        }
    }
}
