import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser"
import compression from "compression"
import "reflect-metadata";
import routes from "./api/routes";
import { DB } from "./infrastructure/database/data-source";
import errorMiddleware from "./api/middleware/errorMiddleware";
dotenv.config();

const app = express();
const PORT = parseInt(process.env["PORT"] as string) || 8080
const HOST = process.env["HOST"]  || `0.0.0.0`

// --- CORS ---//
const allowedOrigins = [
    process.env["MOBILE_CLIENT_ORIGIN"],
    process.env["ADMIN_ORIGIN"],
].filter(Boolean) as string[];

const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-JSON']
};
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

app.use(cookieParser())
app.use(compression())
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// -- ROUTES -- //
const base_api = "/api/v1";
routes(app, base_api)

// --- Error Handling --- //
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);

// connect DB & start server
DB.initialize() 
    .then(() => {
        console.log("Data Source has been initialized!");
        app.listen(PORT, HOST, () => {
            console.log("Server is running on port:" + PORT);
        });
    })
    .catch((error) => console.log(error));

// queues shut down  when the app closes
// process.on('SIGTERM', async () => {
//     await donationRequestQueue.close();
// });