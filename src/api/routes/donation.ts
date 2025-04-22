import { Router } from "express";
import validationMiddleware from "../middleware/inputValidation/index";
import { DonationRequestController } from "../controller/donationRequestController";
import { authenticate } from "../middleware/auth/auth.middleware";

const router = Router();
const { validateDonationRequestInput, validateDonationRequestInputForSomeoneElse, requireBody, validate } = validationMiddleware;
const controller = new DonationRequestController()

router.get('/request/open', controller.getOpenDonationRequests.bind(controller)) // Get all open donation requests
router.route('/request/:requestID')
    .get(controller.getDonationRequest.bind(controller)) // Get a donation request by ID
    .patch([requireBody, validate], controller.updateDonationRequest.bind(controller))
    .delete(controller.deleteDonationRequest.bind(controller));

// Authenticated routes
router.use(authenticate)

/*//--- DonationRequest Routes ---//*/
router.post('/request', [
    ...validateDonationRequestInput, requireBody, validate
],
    controller.createDonationRequest.bind(controller)); // Create a new blood donation request

router.post('/request/other-person', [
    ...validateDonationRequestInputForSomeoneElse, requireBody, validate
],
    controller.createDonationRequest.bind(controller)); // Create a new blood donation request for someone else
router.get('/request/me', controller.getUserDonationRequests.bind(controller)) // Get user donation requests




/*--- Donation Routes ---*/
router.post('/donate/confirm-availability/:requestID', controller.confirmDonorAvailability.bind(controller)) // Confirm donor's availability (Creates a Donation with  status 'scheduled')

router.post('/', [requireBody, validate]); // Creates a new donation wih status 'completed'
router.get('/all',) // Get all donations
router.get('/:donationID',)
router.patch('/:donationID', requireBody, [validate])
router.delete('/:donationID',)

export default router;

