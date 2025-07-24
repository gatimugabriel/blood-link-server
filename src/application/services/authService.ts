import bcrypt from "bcrypt";
import {UserRepository} from "../../domain/repositories/userRepository";
import {CreateUserDto, GoogleUserDto, LoginUserDto, UserTokenDto} from "../dtos/userDto";
import {Token, User} from "../../domain/entity/User";
import {createPoint} from "../../utils/database";
import {generateAuthTokens} from "../../utils/token";
import mailerUtil from "../../utils/mailer";
import { NotificationService } from "./notificationService";

export class AuthService {
    private readonly notificationService: NotificationService;

    constructor(private readonly userRepository: UserRepository) {
        this.notificationService = new NotificationService();
    }

    async createUser(userData: CreateUserDto): Promise<User> {
        const defaultValues = {
            role: "user",
            user_source: "email",
            isVerified: false,
            status: "inactive",
            googleId: null,
            lastDonationDate: null,
        };

        const dataToSave = {...defaultValues, ...userData};

        if (!userData.primaryLocation) {
            dataToSave.primaryLocation = createPoint(dataToSave.lastKnownLocation.latitude, dataToSave.lastKnownLocation.longitude)
        } else {
            dataToSave.primaryLocation = createPoint(dataToSave.primaryLocation.latitude, dataToSave.primaryLocation.longitude)
        }

        dataToSave.lastKnownLocation = createPoint(dataToSave.lastKnownLocation.latitude, dataToSave.lastKnownLocation.longitude)
        dataToSave.password = bcrypt.hashSync(dataToSave.password, 10);
        dataToSave.email = dataToSave.email.toLowerCase();
        dataToSave.age = parseInt(String(userData?.age))

        const newUser = new User();
        Object.assign(newUser, dataToSave);

        return this.userRepository.saveUser(newUser);
    }

    //  @ authenticateUser
    //  Generates JWT tokens
    async authenticateUser(loginData: LoginUserDto): Promise<{ accessToken: string, refreshToken: string }> {
        const user = await this.userRepository.findUser({
            where: {email: (loginData.email).toLowerCase()}
        });
        if (!user) {
            throw new Error("Invalid credentials");
        }

        const isPasswordValid = bcrypt.compareSync(loginData.password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid credentials");
        }

        const {accessToken, refreshToken} = generateAuthTokens(user.id, user.role, user.email)

        // --- save refresh token to DB ---//
        const tokenData: UserTokenDto = {
            userID: user.id,
            token: refreshToken,
            type: "refresh"
        }

        const token = new Token();
        Object.assign(token, tokenData);
        await this.userRepository.saveToken(token);

        return {accessToken, refreshToken};
    }

    //  @ (Signout) -> clear refresh token from DB
    async clearAuthCredentials(userID: string, refreshToken: string): Promise<any> {
        const tokenToDelete = await this.getAuthCredentials(userID, refreshToken, "refresh")
        return this.userRepository.deleteUserToken(tokenToDelete);
    }

    //get auth credentials
    async getAuthCredentials(userID: string, tokenString: string, tokenType: string): Promise<Token> {
        const userToken = await this.userRepository.findUserToken({
            where: {
                userID,
                token: tokenString,
                type: tokenType
            }
        });
        if (!userToken) {
            throw new Error(`Invalid ${tokenType} Token`);
        }
        return userToken;
    }

    // Generate and send a verification code to the user's mobile phone
    async requestMobileVerification(data: { phone: string }): Promise<string> {
        try {
            const existingUser = await this.userRepository.findUser({
                where: { phone: data.phone }
            });

            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            const tokenData: UserTokenDto = {
                userID: existingUser?.id || 'temp-' + Date.now(),
                token: verificationCode,
                type: "verification"
            };

            const token = new Token();
            Object.assign(token, tokenData);
            await this.userRepository.saveToken(token);

            console.log(`Verification code for ${data.phone}: ${verificationCode}`);

            return verificationCode;
        } catch (error) {
            console.error('Error requesting mobile verification:', error);
            throw new Error('Failed to send verification code');
        }
    }

    // Generate and send a verification code to the user's email
    async requestEmailVerification(data: { email: string }): Promise<string> {
        try {
            const existingUser = await this.userRepository.findUser({
                where: { email: data.email.toLowerCase() }
            });

            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            const tokenData: UserTokenDto = {
                userID: existingUser?.id || 'temp-' + Date.now(),
                token: verificationCode,
                type: "verification"
            };

            const token = new Token();
            Object.assign(token, tokenData);
            await this.userRepository.saveToken(token);

            await mailerUtil.sendVerificationEmail({userName: existingUser?.firstName as string, email: existingUser?.email as string, token: token.token as string});

            console.log(`Verification code for ${data.email}: ${verificationCode}`);

            return verificationCode;
        } catch (error) {
            console.error('Error requesting email verification:', error);
            throw new Error('Failed to send verification code');
        }
    }

    // Verify a code sent to the user
    async verifyCode(data: { code: string, identifier: string }): Promise<boolean> {
        try {
            const token = await this.userRepository.findUserToken({
                where: {
                    token: data.code,
                    type: "verification"
                }
            });

            if (!token) {
                throw new Error('Invalid verification code');
            }

            if (!token.userID.startsWith('temp-')) {
                const user = await this.userRepository.findUser({
                    where: { id: token.userID }
                });

                if (user) {
                    user.isVerified = true;
                    await this.userRepository.updateUser(user);
                }
            }

            await this.userRepository.deleteUserToken(token);

            return true;
        } catch (error) {
            console.error('Error verifying code:', error);
            throw new Error('Failed to verify code');
        }
    }

    // Authenticate or create a user with Google credentials
    async authenticateGoogleUser(userData: GoogleUserDto): Promise<{ user: User, isNewUser: boolean, accessToken: string, refreshToken: string }> {
        let user = await this.userRepository.findUser({
            where: [{ email: userData.email }, { googleId: userData.googleId }]
        });

        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            const defaultLocation = { latitude: 0, longitude: 0 }; 

            const newUser = new User();
            Object.assign(newUser, {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email.toLowerCase(),
                googleId: userData.googleId,
                profilePicture: userData.profilePicture,
                password: bcrypt.hashSync(Math.random().toString(36).slice(-8), 10), // Random password
                role: "user",
                user_source: "google",
                isVerified: true,
                status: "active",
                lastDonationDate: null,
                primaryLocation: createPoint(defaultLocation.latitude, defaultLocation.longitude),
                lastKnownLocation: createPoint(defaultLocation.latitude, defaultLocation.longitude)
            });

            user = await this.userRepository.saveUser(newUser);
        } else if (!user.googleId) {
            user.googleId = userData.googleId;
            user.isVerified = true;
            user.user_source = "google";
            if (userData.profilePicture && !user.profilePicture) {
                user.profilePicture = userData.profilePicture;
            }
            user = await this.userRepository.updateUser(user);
        }

        // Generate & save tokens
        const { accessToken, refreshToken } = generateAuthTokens(user.id, user.role, user.email);
                const tokenData: UserTokenDto = {
            userID: user.id,
            token: refreshToken,
            type: "refresh"
        };

        const token = new Token();
        Object.assign(token, tokenData);
        await this.userRepository.saveToken(token);

        return { user, isNewUser, accessToken, refreshToken };
    }
}
