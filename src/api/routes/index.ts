import { Express, Router } from 'express'
import userRoutes from "./user";
import authRoutes from "./auth";
import donationRoutes from "./donation";
import notificationRoutes from "./notification";
import healthFacilityRoutes from "./healthFacility";
import reportRoutes from "./report";
import adminRoutes from "./admin";

// import events from "../sse"

const routes = (app: Express, base_api: string) => {
    const router = Router()

    router.use('/auth', authRoutes)
    router.use('/user', userRoutes)
    router.use('/donation', donationRoutes)
    router.use('/notifications', notificationRoutes)
    router.use('/health-facility', healthFacilityRoutes)
    router.use('/reports', reportRoutes)
    router.use('/admin', adminRoutes)

    //--- SSE Endpoints ---//
    // router.use('/sse', events)

    app.use(`${base_api}`, router)
}

export default routes
