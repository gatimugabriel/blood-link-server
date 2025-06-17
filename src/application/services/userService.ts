import { UserRepository } from "../../domain/repositories/userRepository";
import { createPoint } from "../../utils/database";
import bcrypt from "bcrypt";
import { UserTokenDto } from "../dtos/userDto";
import { Token } from "../../domain/entity/User";
import { User } from "../../domain/entity/User";

export class UserService {
    constructor(private readonly userRepository: UserRepository) {
    }

    async createUser(userData: any): Promise<User> {
        const defaultValues = {
            role: "user",
            user_source: "email",
            isVerified: false,
            status: "active", // Set to active for seeded users
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

    async listUsers (
        page: number,
        limit: number,
        latitude?: number,
        longitude?: number,
        radius?: number,
        sortBy: string = 'createdAt',
        sortOrder: 'asc' | 'desc' = 'desc',
        status?: string,
        search?: string,
        bloodGroup?: string,
    ):Promise<[User[], number]> {
        const offset = (page - 1) * limit;
        return await this.userRepository.listUsers2(
            offset,
            limit,
            latitude,
            longitude,
            radius,
            sortBy,
            sortOrder.toUpperCase() as "ASC" | "DESC",
            status,
            search,
            bloodGroup,
        )
    }

    //  get  users within a specified range(radius distance in meters)
    async getUsersWithinRange(lat: number, long: number, dis: number) {
        return await this.userRepository.getUsersWithinRadius(lat, long, dis)
    }

    //   test data
    async insertManyUsers(data: any[]) {
        for (const user of data) {
            user.primaryLocation = createPoint(user.primaryLocation.latitude, user.primaryLocation.longitude)
            user.lastKnownLocation = createPoint(user.lastKnownLocation.latitude, user.lastKnownLocation.longitude)
            user.password = bcrypt.hashSync(user.password, 10);

            await this.userRepository.saveUser(user)
        }

        console.log("Bulk Inserted  users!");
    }

    async getUser(userID = '', userEmail = '') {
        if (userID === '') {
            return await this.userRepository.findUser({
                where: { email: userEmail },
                relations: { tokens: true },
                select: {
                    tokens: {
                        token: true,
                        type: true
                    }
                }
            })
        }
        return await this.userRepository.findUser({
            where: { id: userID },
        })
    }

    async saveUserToken(userID: string, tokenString: string, tokenType: string) {
        const tokenData: UserTokenDto = {
            userID,
            token: tokenString,
            type: tokenType
        }

        const existingToken = await this.userRepository.findUserToken({
            where: { userID, type: tokenType, token: tokenString },
            select: {
                token: true,
                type: true,
            }
        })
        if (existingToken) {
            console.log("fcm token exists");
            return existingToken
        }

        const token = new Token();
        Object.assign(token, tokenData);
        return await this.userRepository.saveToken(token);
    }

    async getUserTokens(userID = '', tokenType: string) {
        if (userID === '') {
            // find tokens without user id
            return await this.userRepository.findManyUserTokens({
                where: { type: tokenType },
                select: {
                    token: true,
                    type: true,
                }
            })
        }

        return await this.userRepository.findManyUserTokens({
            where: { userID, type: tokenType },
            select: {
                token: true,
                type: true,
            }
        })
    }
}
