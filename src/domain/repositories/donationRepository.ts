import {FindOneOptions, Repository} from "typeorm";
import {User} from "../entity/User";
import {DB} from "../../infrastructure/database/data-source";
import {DonationRequest} from "../entity/DonationRequest";
import {Donation} from "../entity/Donation";
import {BloodType} from "../value-objects/bloodType";

/*--- Contains all the database operations related to the DonationRequest & Donations entities ---*/
export class DonationRepository {
    private requestRepo: Repository<DonationRequest>
    private donationRepo: Repository<Donation>

    constructor() {
        this.requestRepo = DB.getRepository(DonationRequest);
        this.donationRepo = DB.getRepository(Donation);
    }

    // 1. ----------  Requests ----------- //

    async createDonationRequest(request: DonationRequest): Promise<DonationRequest> {
        return await this.requestRepo.save(request);
    }

    // Find request by ID
    async findRequestById(requestID: string): Promise<DonationRequest | null> {
        return await this.requestRepo.findOne({
            where: {id: requestID},
            relations: {user: true},
            select: {
                user: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    primaryLocation: true,
                    lastKnownLocation: true
                }
            }
        });
    }

    async findDonationRequests(
        offset: number,
        limit: number,
        latitude?: number,
        longitude?: number,
        radiusInMeters?: number,
        sortBy: string = 'createdAt',
        sortOrder: 'ASC' | 'DESC' = 'DESC',
        status?: string,
        dateFrom?: string,
        dateTo?: string,
        search?: string,
        bloodGroup?: string,
        urgency?: string,
    ): Promise<[DonationRequest[], number]> {
        // when no coordinates are provided
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
            const queryBuilder = this.requestRepo.createQueryBuilder('donationRequest')
                .select(['donationRequest', 'user.id', 'user.lastKnownLocation', 'user.firstName', "user.lastName", 'user.email', 'user.phone'])
                .leftJoin('donationRequest.user', 'user')
                .orderBy(`donationRequest.${sortBy}`, sortOrder)
                .skip(offset)
                .take(limit);

            if (status) {
                queryBuilder.andWhere('donationRequest.status = :status', {status});
            }
            if (dateFrom) {
                queryBuilder.andWhere('donationRequest.createdAt >= :dateFrom', {dateFrom});
            }
            if (dateTo) {
                queryBuilder.andWhere('donationRequest.createdAt <= :dateTo', {dateTo});
            }
            if (search) {
                queryBuilder.andWhere(
                    '(donationRequest.patientName ILIKE :search OR donationRequest.healthFacility ILIKE :search OR CAST(donationRequest.bloodGroup AS TEXT) ILIKE :search)',
                    {search: `%${search}%`}
                );
            }
            if (bloodGroup) {
                queryBuilder.andWhere('donationRequest.bloodGroup = :bloodGroup', {bloodGroup});
            }
            if (urgency) {
                queryBuilder.andWhere('donationRequest.urgency = :urgency', {urgency});
            }

            return await queryBuilder.getManyAndCount();
        } else {
            if (isNaN(<number>radiusInMeters) || radiusInMeters === null || radiusInMeters === undefined) {
                radiusInMeters = 50000;
            }

            const rawQuery = `
                WITH filtered_requests AS (SELECT dr.*,
                                                  u.id                                  AS user_id,
--                                            u."lastKnownLocation",
--                                            u."primaryLocation",
--                                               u."firstName",
--                                               u."lastName",
--                                               u.email,
--                                               u.phone,
                                                  ST_Y(u."lastKnownLocation"::geometry) AS user_last_known_latitude,
                                                  ST_X(u."lastKnownLocation"::geometry) AS user_last_known_longitude,
                                                  ST_X(u."primaryLocation"::geometry)   AS user_primary_longitude,
                                                  ST_Y(u."primaryLocation"::geometry)   AS user_primary_latitude,

                                                  ST_X(dr."requestLocation"::geometry)  AS request_longitude,
                                                  ST_Y(dr."requestLocation"::geometry)  AS request_latitude,

                                                  ST_Distance(
                                                          dr."requestLocation"::geography,
                                                          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                                                  )                                     AS distance_meters

                                           FROM donation_request dr
                                                    LEFT JOIN public."user" u on u.id = dr."userId"

                                           WHERE ST_DWithin(
                                                   dr."requestLocation"::geography,
                                                   ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3
                                                 )

                                             AND dr."status" = $6

                                           ORDER BY distance_meters)

                SELECT *,
--                    (SELECT COUNT(*) FROM filtered_requests) AS total_count
                       (SELECT COUNT(*) FROM donation_request WHERE "status" = 'open') AS total_count,   -- Total unfiltered count
                       (SELECT COUNT(*) FROM filtered_requests)                        AS filtered_count -- Count of filtered records
                FROM filtered_requests
                ORDER BY distance_meters ASC
                LIMIT $4 OFFSET $5
            `

            const results = await this.requestRepo.query(rawQuery, [
                longitude,      // $1 longitude
                latitude,       // $2 latitude
                radiusInMeters,  // $3 - radius
                limit,          // $5 - limit
                offset,         // $5 - offset
                status          // $6 - status
            ]);

            // Transform raw results into DonationRequest entities
            const donationRequests = results.map((row: any) => {
                const request = new DonationRequest();
                Object.assign(request, {
                    id: row.id,
                    bloodGroup: row.bloodGroup,
                    urgency: row.urgency,
                    units: row.units,
                    status: row.status,
                    requestLocation: {
                        latitude: row.request_latitude,
                        longitude: row.request_longitude,
                    },
                    requestFor: row.requestFor,
                    healthFacility: row.healthFacility,
                    patientName: row.patientName,
                    mobileNumber: row.mobileNumber,
                    stringRequestLocation: row.stringRequestLocation,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    deletedAt: row.deleted_at,

                    user: {
                        id: row.userId,
                        lastKnownLocation: {
                            latitude: row.user_last_known_latitude,
                            longitude: row.user_last_known_longitude,
                        },
                        primaryLocation: {
                            latitude: row.user_primary_latitude,
                            longitude: row.user_primary_longitude,
                        },
                        email: row.email,
                        phone: row.phone,
                        firstName: row.firstName,
                        lastName: row.lastName
                    }
                });
                return request;
            });

            // [entities, total count]
            return [donationRequests, results.length ? parseInt(results[0].total_count) : 0];
        }
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

        const query0 = `
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

        const query = `
            SELECT u.*,
                   ST_Distance(
                           u."lastKnownLocation"::geography,
                           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                   )                          AS distance_meters,
                   COALESCE(array_agg(t.token) FILTER (WHERE t.type = 'fcm' AND t.token IS NOT NULL),
                            ARRAY []::text[]) AS tokens
            FROM "user" u
                     LEFT JOIN "token" t ON u."id"::uuid = t."userID"::uuid
            WHERE ST_DWithin(
                    u."lastKnownLocation"::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    $3
                  )
              AND u."bloodGroup" = ANY ($4)
              AND u."status" = 'active'
              AND (u."lastDonationDate" IS NULL OR u."lastDonationDate" < NOW() - INTERVAL '56 days')
              AND u."id"::uuid != $5::uuid
              AND NOT EXISTS (SELECT 1
                              FROM "donation_request"
                              WHERE "donation_request"."userId" = u."id"
                                AND "donation_request"."status" = 'open'
                                AND "donation_request"."requestFor" = 'self')
            GROUP BY u.id,
                     u."firstName",
                     u."lastName",
                     u."email",
                     u."phone",
                     u."password",
                     u."bloodGroup",
                     u."role",
                     u."user_source",
                     u."isVerified",
                     u."status",
                     u."googleId",
                     u."primaryLocation",
                     u."lastKnownLocation",
                     u."lastDonationDate",
                     u."createdAt",
                     u."updatedAt",
                     u."deletedAt"
            ORDER BY distance_meters;
        `


        try {
            const result = await this.requestRepo.query(query, [longitude, latitude, radiusInMeters, compatibleBloodTypes, userId]);

            return result.map((row: any) => {
                const user = new User();
                Object.assign(user, {
                    ...row,
                    fcm_tokens: row.tokens || []
                });
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

    // 2. #################  DONATIONS ############### //

    // Create a new donation
    async createDonation(donation: Donation): Promise<Donation> {
        return await this.donationRepo.save(donation);
    }

    // find a donation
    async findDonation(options: FindOneOptions<Donation>): Promise<Donation | null> {
        return this.donationRepo.findOne(options);
    }

    // Find donations with filters
    async findDonations(
        offset: number,
        limit: number,
        sortBy: string = 'createdAt',
        sortOrder: 'ASC' | 'DESC' = 'DESC',
        status?: string,
        dateFrom?: string,
        dateTo?: string,
        search?: string,
        bloodGroup?: string,
        donorId?: string,
        requestId?: string,
    ): Promise<[Donation[], number]> {
        const queryBuilder = this.donationRepo.createQueryBuilder('donation')
            .select(['donation', 'donor.id', 'donor.firstName', 'donor.lastName', 'donor.email', 'donor.phone', 'donor.bloodGroup'])
            .leftJoin('donation.donor', 'donor')
            .leftJoin('donation.request', 'request')
            .leftJoin('request.user', 'requestUser')
            .addSelect(['request.id', 'request.bloodGroup', 'request.urgency', 'request.status', 'request.healthFacility', 'request.patientName', 'request.requestFor'])
            .addSelect(['requestUser.id', 'requestUser.firstName', 'requestUser.lastName', 'requestUser.email', 'requestUser.phone'])
            .orderBy(`donation.${sortBy}`, sortOrder)
            .skip(offset)
            .take(limit);

        // Add status filter if provided
        if (status) {
            queryBuilder.andWhere('donation.status = :status', {status});
        }

        // Add date range filters if provided
        if (dateFrom) {
            queryBuilder.andWhere('donation.createdAt >= :dateFrom', {dateFrom});
        }
        if (dateTo) {
            queryBuilder.andWhere('donation.createdAt <= :dateTo', {dateTo});
        }

        // Add search filter if provided
        if (search) {
            queryBuilder.andWhere(
                '(donor.firstName ILIKE :search OR donor.lastName ILIKE :search OR donor.email ILIKE :search OR request.patientName ILIKE :search OR request.healthFacility ILIKE :search)',
                {search: `%${search}%`}
            );
        }

        // Add blood group filter if provided
        if (bloodGroup) {
            queryBuilder.andWhere('request.bloodGroup = :bloodGroup', {bloodGroup});
        }

        // Add donor ID filter if provided
        if (donorId) {
            queryBuilder.andWhere('donor.id = :donorId', {donorId});
        }

        // Add request ID filter if provided
        if (requestId) {
            queryBuilder.andWhere('request.id = :requestId', {requestId});
        }

        return await queryBuilder.getManyAndCount();
    }
}