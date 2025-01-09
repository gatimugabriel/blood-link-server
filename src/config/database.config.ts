import dotenv from 'dotenv';
dotenv.config();

    export const redisConfig = {
    host: process.env['REDIS_HOST'],
    port: parseInt(process.env['REDIS_PORT'] as string),
    // url: process.env['REDIS_URL']
}

export const dbConfig = {
    HOST: process.env['DB_HOST'],
    USER: process.env['DB_USER'],
    PASSWORD: process.env['DB_USER_PASSWORD'],
    DB: process.env['DB_NAME'],
    PORT: process.env['DB_PORT'],
    dialect: "postgres",
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
}

