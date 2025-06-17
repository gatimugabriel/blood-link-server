import { Express, Router } from 'express'
import userRoutes from "./user";
import authRoutes from "./auth";
import donationRoutes from "./donation";
import donationRequestRoutes from "./donationRequest";
import adminRoutes from "./admin";
import dataSeedingRoutes from "./dataSeeding";
// import events from "../sse"

const routes = (app: Express, base_api: string) => {
    const router = Router()

    router.use('/auth', authRoutes)
    router.use('/user', userRoutes)
    router.use('/donation', donationRoutes)
    router.use('/request', donationRequestRoutes)
    router.use('/admin', adminRoutes)
    router.use('/data', dataSeedingRoutes)

    //--- SSE Endpoints ---//
    // router.use('/sse', events)

    app.use(`${base_api}`, router)
}

export default routes
