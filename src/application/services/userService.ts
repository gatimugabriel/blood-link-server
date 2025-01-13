import {UserRepository} from "../../infrastructure/repositories/userRepository";
import {createPoint} from "../../utils/database";
import bcrypt from "bcrypt";
import {UserTokenDto} from "../dtos/userDto";
import {Token} from "../../domain/entity/User";

export class UserService {
    constructor(private readonly userRepository: UserRepository) {
    }

    //  get  users within a specified range(radius distance in meters)
    async getUsersWithinRange(lat: number, long: number, dis: number) {
        return await this.userRepository.getUsersWithinRadius(lat, long, dis)
    }

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
                where: {email: userEmail},
                relations: {tokens: true},
                select: {
                    tokens: {
                        token: true,
                        type: true
                    }
                }
            })
        }
        return await this.userRepository.findUser({
            where: {id: userID},
        })
    }

    async saveUserToken(userID: string, tokenString: string, tokenType: string) {
        const tokenData: UserTokenDto = {
            userID,
            token: tokenString,
            type: tokenType
        }
        const token = new Token();
        Object.assign(token, tokenData);
        return await this.userRepository.saveToken(token);
    }

    async getUserTokens(userID = '', tokenType: string) {
        if (userID === '') {
            // find tokens without user id
            return await this.userRepository.findManyUserTokens({
                where: {type: tokenType},
                select: {
                    token: true,
                    type: true,
                }
            })
        }

        return await this.userRepository.findManyUserTokens({
            where: {userID, type: tokenType},
            select: {
                token: true,
                type: true,
            }
        })
    }
}
