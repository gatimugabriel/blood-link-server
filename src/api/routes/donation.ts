import {Router} from "express";
import validationMiddleware from "../middleware/inputValidation/index";
import {DonationController} from "../controller/donationController";
import { authenticate } from "../middleware/auth/auth.middleware";

const router = Router();
const {
    requireBody,
    validate
} = validationMiddleware;
const controller = new DonationController()

// Authenticated routes
router.use(authenticate)

router.post('/', [requireBody, validate]); // Creates a new donation wih status 'completed'
router.post('/donate/confirm-availability/:requestID', controller.confirmDonorAvailability.bind(controller)) // confirm donor's availability (Creates a Donation with  status 'scheduled')
router.post('/donate/complete/:donationID', controller.completeDonation.bind(controller)) // complete a scheduled donation
router.post('/donate/cancel/:donationID', controller.cancelDonation.bind(controller)) // cancel a scheduled donation

router.get('/', controller.getAllDonations.bind(controller)) // Get all donations
router.get('/user/me', controller.getUserDonations.bind(controller)) // Get current user's donations
router.route('/:id')
    .get(controller.getDonation.bind(controller))
    .patch(requireBody, [validate], controller.updateDonation.bind(controller))
    .delete()
router.get('/by-request/:id', controller.getDonationsByRequest.bind(controller)) // Get donations by request ID

export default router;