import {Router} from "express";
import validationMiddleware from "../middleware/inputValidation/index";
import {DonationController} from "../controller/donationController";

const router = Router();
const {
    requireBody,
    validate
} = validationMiddleware;
const controller = new DonationController()

// Authenticated routes
// router.use(authenticate)

router.post('/', [requireBody, validate]); // Creates a new donation wih status 'completed'
router.post('/donate/confirm-availability/:requestID', controller.confirmDonorAvailability.bind(controller)) // Confirm donor's availability (Creates a Donation with  status 'scheduled')
router.post('/donate/complete/:donationID', controller.completeDonation.bind(controller)) // Complete a scheduled donation
router.post('/donate/cancel/:donationID', controller.cancelDonation.bind(controller)) // Cancel a scheduled donation

router.get('/', controller.getAllDonations.bind(controller)) // Get all donations
router.route('/:id')
    .get(controller.getDonation.bind(controller))
    .patch(requireBody, [validate], controller.updateDonation.bind(controller))
    .delete()

export default router;