import "reflect-metadata";
import { DataSource } from "typeorm";
import { Donation } from "../../domain/entity/Donation";
import { DonationRequest } from "../../domain/entity/DonationRequest";
import { HealthFacility } from "../../domain/entity/HealthFacility";
import { Notification } from "../../domain/entity/Notification";
import { Token, User } from "../../domain/entity/User";

import dotenv from "dotenv";

dotenv.config()

const { DB_HOST, DB_PORT, DB_USER, DB_USER_PASSWORD, DB_NAME, DB_SCHEMA, NODE_ENV } =
    process.env;

export const DB = new DataSource({
    type: "postgres",
    host: DB_HOST,
    port: parseInt(DB_PORT as string),
    username: DB_USER,
    password: DB_USER_PASSWORD,
    database: DB_NAME,

    // ssl: {
    //     rejectUnauthorized: true,
    //     ca: [fs.readFileSync(path.resolve(__dirname, "../../../src/security/database.pem")).toString()]
    // },

    // poolSize: 10,
    connectTimeoutMS: 10000,
    schema: DB_SCHEMA,

    synchronize: NODE_ENV !== "dev",
    //logging logs sql command on the terminal
    logging: NODE_ENV == "development",
    entities: [User, Token, DonationRequest, Donation, Notification, HealthFacility],
    migrations: [__dirname + "/infrastructure/database/migrations/*.ts"],
    subscribers: [],
});
