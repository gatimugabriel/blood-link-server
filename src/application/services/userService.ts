import { UserRepository } from "../../infrastructure/repositories/userRepository";
import { createPoint } from "../../utils/database";
import bcrypt from "bcrypt";

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
            return await this.userRepository.findByEmail(userEmail)
        }
        return await this.userRepository.findByID(userID);
    }
}
