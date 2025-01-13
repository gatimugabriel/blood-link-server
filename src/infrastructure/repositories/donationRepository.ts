import {FindOneOptions, Repository} from "typeorm";
import {User} from "../../domain/entity/User";
import {DB} from "../database/data-source";
import {DonationRequest} from "../../domain/entity/DonationRequest";
import {Donation} from "../../domain/entity/Donation";
import {BloodType} from "../../domain/value-objects/bloodType";

/*--- Contains all the database operations related to the DonationRequest entity ---*/
export class DonationRepository {
    private requestRepo: Repository<DonationRequest>
    private donationRepo: Repository<Donation>

    constructor() {
        this.requestRepo = DB.getRepository(DonationRequest);
        this.donationRepo = DB.getRepository(Donation);
    }

    // Create a new donation request
    async createDonationRequest(request: DonationRequest): Promise<DonationRequest> {
        return await this.requestRepo.save(request);
    }

    // Find request
    async findRequest(requestID: string): Promise<DonationRequest[]> {
        return await this.requestRepo.find({
            where: {id: requestID},
            relations: {user: true},
            select: {
                user: {
                    id: true,
                    firstName: true,
                    email: true,
                }
            }
        });
    }

    // Find all donation requests
    async findAllDonationRequests(): Promise<DonationRequest[]> {
        return await this.requestRepo.find();
    }

    // Find all open donation requests
    async findOpenDonationRequests(offset: number, limit: number): Promise<[DonationRequest[], number]> {
        return await this.requestRepo.createQueryBuilder('donationRequest')
            .select(['donationRequest', 'user.id'])
            .leftJoin('donationRequest.user', 'user')
            .where('donationRequest.status = :status', {status: 'open'})
            .skip(offset)
            .take(limit)
            .orderBy('donationRequest.createdAt', 'DESC')
            .getManyAndCount();
    }

    // Find a donation request by ID
    async findDonationRequestById(requestID: string): Promise<DonationRequest | null> {
        return await this.requestRepo.findOne({where: {id: requestID}})
    }

    // Update a donation request
    async updateDonationRequest(request: DonationRequest): Promise<DonationRequest> {
        return await this.requestRepo.save(request);
    }

    // Delete a donation request
    async deleteDonationRequest(requestID: string): Promise<any> {
        return await this.requestRepo.delete({id: requestID});
    }

    // Find nearby possible donors
    async findNearbyDonors(latitude: number, longitude: number, radiusInMeters: number, bloodGroup: BloodType, userId: string): Promise<User[]> {
        let compatibleBloodTypes: string[]

        switch (bloodGroup) {
            case "AB+": // universal recipient
                compatibleBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
                break;
            case 'AB-':
                compatibleBloodTypes = ['A-', 'B-', 'AB-', 'O-'];
                break;
            case 'A+':
                compatibleBloodTypes = ['A+', 'A-', 'O+', 'O-'];
                break;
            case 'A-':
                compatibleBloodTypes = ['A-', 'O-'];
                break;
            case 'B+':
                compatibleBloodTypes = ['B+', 'B-', 'O+', 'O-'];
                break;
            case 'B-':
                compatibleBloodTypes = ['B-', 'O-'];
                break;
            case 'O+':
                compatibleBloodTypes = ['O+', 'O-'];
                break;
            case 'O-':  // O- can only receive O-
                compatibleBloodTypes = ['O-'];
                break;
            default:
                throw new Error('Invalid blood type');
        }

        const query2 = `
            SELECT *
            FROM "user"
            WHERE ST_DWithin(
                    "lastKnownLocation"::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    $3
                  )
              AND "bloodGroup" = ANY ($4)
              AND "status" = 'active'
              AND ("lastDonationDate" IS NULL OR "lastDonationDate" < NOW() - INTERVAL '56 days')
              AND "id" != $5
              AND NOT EXISTS (SELECT 1
                              FROM "donation_request"
                              WHERE "donation_request"."userId" = "user"."id"
                                AND "donation_request"."status" = 'open'
                                AND "donation_request"."requestFor" = 'self');
        `;

        const query = `
            SELECT *,
                   ST_Distance(
                           "lastKnownLocation"::geography,
                           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                   ) AS distance_meters
            FROM "user"
            WHERE ST_DWithin(
                    "lastKnownLocation"::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    $3
                  )
              AND "bloodGroup" = ANY ($4)
              AND "status" = 'active'
              AND ("lastDonationDate" IS NULL OR "lastDonationDate" < NOW() - INTERVAL '56 days')
              AND "id" != $5
              AND NOT EXISTS (SELECT 1
                              FROM "donation_request"
                              WHERE "donation_request"."userId" = "user"."id"
                                AND "donation_request"."status" = 'open'
                                AND "donation_request"."requestFor" = 'self')
            ORDER BY distance_meters;
        `;

        try {
            const result = await this.requestRepo.query(query, [longitude, latitude, radiusInMeters, compatibleBloodTypes, userId]);

            // Convert raw results to User entities
            return result.map((row: any) => {
                const user = new User();
                Object.assign(user, row);
                return user;
            });

        } catch (err) {
            console.log("Error finding nearby donors:->", err);
            throw new Error("Error finding nearby donors");
        }
    }

    // get all user requests
    async findUserDonationRequests(userID: string): Promise<[DonationRequest[], number]> {
        return await this.requestRepo.findAndCount({where: {user: {id: userID}}});
    }

    // Find any open donation request by user
    async findOpenRequestsByUser(userID: string): Promise<DonationRequest[]> {
        const query = `
            SELECT *
            FROM "donation_request"
            WHERE "userId" = $1
              AND status = 'open'
            ORDER BY "requestFor" ASC
        `;

        const result = await this.requestRepo.query(query, [userID]);
        if (!result || result.length === 0) {
            return [];
        }

        return result;
    }


    ///----- DONATIONS-----//
    // Create a new donation
    async createDonation(donation: Donation): Promise<Donation> {
        return await this.donationRepo.save(donation);
    }

    // find a donation
    async findOne(options: FindOneOptions<Donation>): Promise<Donation | null> {
        return this.donationRepo.findOne(options);
    }
}
