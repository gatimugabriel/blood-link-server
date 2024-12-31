import { Repository } from "typeorm";
import { User } from "../../domain/entity/User";
import { DB } from "../database/data-source";
import { DonationRequest } from "../../domain/entity/DonationRequest";
import { BloodType } from "../../domain/value-objects/bloodType";

/*--- Contains all the database operations related to the DonationRequest entity ---*/
export class DonationRepository {
    private repository: Repository<DonationRequest>

    constructor() {
        this.repository = DB.getRepository(DonationRequest);
    }

    // Create a new donation request
    async createDonationRequest(request: DonationRequest): Promise<DonationRequest> {
        return this.repository.save(request);
    }

    // Find request
    async findRequest(requestID: string): Promise<DonationRequest[]> {
        return this.repository.find({ where: { id: requestID } });
    }

    // Find all donation requests
    async findAllDonationRequests(): Promise<DonationRequest[]> {
        return this.repository.find();
    }

    // Find all open donation requests
    async findOpenDonationRequests(offset: number, limit: number): Promise<[DonationRequest[], number]> {
        return this.repository.findAndCount({
            where: { status: 'open' },
            skip: offset,
            take: limit,
        });
    }

    // Find a donation request by ID
    async findDonationRequestById(requestID: string): Promise<DonationRequest | null> {
        return this.repository.findOne({ where: { id: requestID } })
    }

    // Update a donation request
    async updateDonationRequest(request: DonationRequest): Promise<DonationRequest> {
        return this.repository.save(request);
    }

    // Delete a donation request
    async deleteDonationRequest(requestID: string): Promise<any> {
        return this.repository.delete({ id: requestID });
    }

    // Find nearby possible donors
    async findNearbyDonors(latitude: number, longitude: number, radiusInMeters: number, bloodGroup: BloodType, requesterID: string): Promise<User[]> {
        const query = `
            SELECT *
            FROM "user"
            WHERE ST_DWithin(
                    "lastKnownLocation"::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    $3
                  )
              AND ("bloodGroup" = $4 OR "bloodGroup" = 'O-' OR "bloodGroup" = 'O+')
              AND "status" = 'active'
              AND ("lastDonationDate" IS NULL OR "lastDonationDate" < NOW() - INTERVAL '56 days')
              AND "id" != $5
              AND NOT EXISTS (SELECT 1
                              FROM "donation_request"
                              WHERE "donation_request"."requesterId" = "user"."id"
                                AND "donation_request"."status" = 'open');
        `;

        try {
            const result = await this.repository.query(query, [longitude, latitude, radiusInMeters, bloodGroup, requesterID]);

            // Convert raw results to User entities
            return result.map((row: any) => {
                console.log("Row", row.email, row.bloodGroup)

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
    async findUserDonationRequests(userID: string): Promise<DonationRequest[]> {
        return this.repository.find({ where: { user: userID } });
    }

    // Find any open donation request by user
    async findOpenRequestsByUser(userID: string): Promise<DonationRequest[]> {
        console.log(userID);


        const query = `
            SELECT *
            FROM "donation_request"
            WHERE "userId" = $1
              AND status = 'open'
            ORDER BY "requestFor" ASC
        `;

        const result = await this.repository.query(query, [userID]);
        if (!result || result.length === 0) {
            return [];
        }

        return result;
    }
}
