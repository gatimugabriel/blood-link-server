import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import "reflect-metadata";
import errorMiddleware from "./api/middleware/errorMiddleware";
import routes from "./api/routes";
import adminRoutes from "./api/routes/admin";
import { DB } from "./infrastructure/database/data-source";

dotenv.config();

const app = express();

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true, limit: '10mb'}));
app.use(morgan('dev'));
app.use(cookieParser())
app.use(compression())

// --- CORS ---//
const allowedOrigins = [
    process.env["MOBILE_CLIENT_ORIGIN"],
    process.env["ADMIN_PORTAL_ORIGIN"],
].filter(Boolean) as string[];

const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    // methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE',
    allowedHeaders: ['Content-Type', 'Authorization', "Access-Control-Allow-Origin"],
    exposedHeaders: ['Content-Length', 'X-JSON']
};
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// -- ROUTES -- //
app.use('/api/admin', adminRoutes); //admin

const base_api = "/api/v1";
routes(app, base_api) //other

// --- Error Handling --- //
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);

const PORT = parseInt(process.env["PORT"] as string) || 8080
const HOST = process.env["HOST"] || `0.0.0.0`

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