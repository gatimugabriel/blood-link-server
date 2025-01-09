import { Repository } from "typeorm";
import { Token, User } from "../../domain/entity/User";
import { DB } from "../database/data-source";

// Contains all the database operations related to the User entity
// includes the Token entity also for User tokens operations
export class UserRepository {
    private repository: Repository<User>
    private tokenRepository: Repository<Token>

    constructor() {
        this.repository = DB.getRepository(User);
        this.tokenRepository = DB.getRepository(Token);
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.repository.findOne({ where: { email } });
    }

    async findByID(userID: string): Promise<User | null> {
        return await this.repository.findOne({ where: { id: userID } });
    }

    async saveUser(user: User): Promise<User> {
        return await this.repository.save(user);
    }

    async saveToken(userID: string, token: string, tokenType: string): Promise<any>{
        return await this.tokenRepository.save({ userID, token, type: tokenType });
    }

    async deleteUser(userID: string): Promise<any> {
        return await this.repository.delete({ id: userID });
    }

    // Support for raw queries
    async rawQuery(query: string, parameters: any[]): Promise<any> {
        return await this.repository.query(query, parameters);
    }

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

    //--- USER TOKENS ---//
    async saveUserToken(token: Token): Promise<Token> {
        return await this.tokenRepository.save(token);
    }

    async deleteUserToken(token: Token): Promise<any> {
        return await this.tokenRepository.delete({ id: token.id });
    }

    async findUserToken(userID: string, tokenString: string, tokenType: string) {
        return await this.tokenRepository.findOne({ where: { userID, token: tokenString, type: tokenType } });
    }
}
