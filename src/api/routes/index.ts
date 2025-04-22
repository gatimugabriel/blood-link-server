import { Express, Router } from 'express'
import userRoutes from "./user";
import authRoutes from "./auth";
import donationRoutes from "./donation";

// import events from "../sse"

const routes = (app: Express, base_api: string) => {
    const router = Router()

    router.use('/auth', authRoutes)
    router.use('/user', userRoutes)
    router.use('/donation', donationRoutes)

    //--- SSE Endpoints ---//
    // router.use('/sse', events)

    app.use(`${base_api}`, router)
}

export default routes
