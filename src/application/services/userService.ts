import {UserRepository} from "../../domain/repositories/userRepository";
import {createPoint} from "../../utils/database";
import bcrypt from "bcrypt";
import {UserTokenDto} from "../dtos/userDto";
import {Token, User} from "../../domain/entity/User";
import {DonationRepository} from "../../domain/repositories/donationRepository";

export class UserService {
    private readonly donationRepository: DonationRepository;

    constructor(private readonly userRepository: UserRepository) {
        this.donationRepository = new DonationRepository();
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

    async listUsers(
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
    ): Promise<[User[], number]> {
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

        const existingToken = await this.userRepository.findUserToken({
            where: {userID, type: tokenType, token: tokenString},
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

    /**
     * Get user statistics including donation and request history
     * @param userID - The ID of the user
     * @returns User statistics
     */
    async getUserStats(userID: string) {
        // Get user donations
        const [donations, totalDonations] = await this.donationRepository.findDonations(
            0,
            1000,
            'donationDate',
            'DESC',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            userID, // donorId
            undefined,
            undefined
        );

        // user requests
        const [requests, totalRequests] = await this.donationRepository.findUserDonationRequests(userID);

        //  last donation date and next eligible date
        const completedDonations = donations.filter(d => d.status === 'completed');
        const lastDonation = completedDonations.length > 0 ? completedDonations[0].donationDate : null;
        const nextEligibleDate = lastDonation
            ? new Date(new Date(lastDonation).getTime() + (56 * 24 * 60 * 60 * 1000))
            : null;

        return {
            totalDonations: totalDonations,
            lastDonation: lastDonation,
            totalRequests: totalRequests,
            nextEligibleDate: nextEligibleDate,
            donationHistory: donations.map(d => ({
                id: d.id,
                donationDate: d.donationDate,
                bloodGroup: d.request?.bloodGroup || '',
                status: d.status,
            })),
            requestHistory: requests.map(r => ({
                id: r.id,
                createdAt: r.createdAt,
                bloodGroup: r.bloodGroup,
                status: r.status,
                urgency: r.urgency,
            })),
        };
    }
}
