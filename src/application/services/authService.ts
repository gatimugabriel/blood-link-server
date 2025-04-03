import bcrypt from "bcrypt";
import {UserRepository} from "../../domain/repositories/userRepository";
import {CreateUserDto, LoginUserDto, UserTokenDto} from "../dtos/userDto";
import {Token, User} from "../../domain/entity/User";
import {createPoint} from "../../utils/database";
import {generateAuthTokens} from "../../utils/token";

export class AuthService {
    constructor(private readonly userRepository: UserRepository) {
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
}
