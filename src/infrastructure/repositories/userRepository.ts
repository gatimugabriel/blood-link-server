import {FindManyOptions, FindOneOptions, Repository} from "typeorm";
import {Token, User} from "../../domain/entity/User";
import {DB} from "../database/data-source";

// Contains all the database operations related to the User entity
// includes the Token entity also for User tokens operations
export class UserRepository {
    private repository: Repository<User>
    private tokenRepository: Repository<Token>

    constructor() {
        this.repository = DB.getRepository(User);
        this.tokenRepository = DB.getRepository(Token);
    }

    //########--- USER ---##########//
    async saveUser(user: User): Promise<User> {
        return await this.repository.save(user);
    }

    async findUser(options: FindOneOptions<User>): Promise<User | null> {
        return this.repository.findOne(options);
    }

    // async updateUser(user: User): Promise<User> {
    //     return await this.repository.save(user);
    // }
    //
    // async deleteUser(userID: string): Promise<any> {
    //     return await this.repository.delete({ id: userID });
    // }


    //  find users within a specified range (radius distance)
    // @param -> latitude: number
    // @param -> longitude: number
    // @param -> radiusInMeters: number
    async getUsersWithinRadius(latitude: number, longitude: number, radiusInMeters: number) {

        console.log("lat lng, dis", latitude, longitude, radiusInMeters)

        const query = `
            WITH params AS (SELECT $1 AS lat,
                                   $2 AS lon,
                                   $3 AS radius)

            SELECT id,
                   "firstName",
                   "lastName",
                   email,
                   phone,
                   "bloodGroup",
                   ST_AsText("lastKnownLocation") AS last_known_location,
                   ST_Distance(
                           "lastKnownLocation"::geography,
                           ST_SetSRID(ST_MakePoint(params.lon, params.lat), 4326)::geography
                   )                              AS distance_meters
            FROM "user",
                 params
            WHERE ST_DWithin(
                          "lastKnownLocation"::geography,
                          ST_SetSRID(ST_MakePoint(params.lon, params.lat), 4326)::geography,
                          params.radius
                  )
            ORDER BY distance_meters
            ;
        `

        const users = await this.repository.query(query, [latitude, longitude, radiusInMeters])

        return users;
    }

    //########--- USER TOKENS ---##########//
    async saveToken(token: Token): Promise<Token> {
        return await this.tokenRepository.save(token);
    }

    async findUserToken(options: FindOneOptions<Token>): Promise<Token | null> {
        return this.tokenRepository.findOne(options);
    }

    async findManyUserTokens(options: FindManyOptions<Token>): Promise<[Token[], number]> {
        return this.tokenRepository.findAndCount(options);
    }

    async deleteUserToken(token: Token): Promise<any> {
        return await this.tokenRepository.delete({id: token.id});
    }
}
