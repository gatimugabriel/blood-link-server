import { Router } from "express";
import validationMiddleware from "../middleware/inputValidation/index";
import { DonationRequestController } from "../controller/donationRequestController";
import { verifyToken } from "../middleware/auth";

const router = Router();
const { validateDonationRequestInput, validateDonationRequestInputForSomeoneElse, requireBody, validate } = validationMiddleware;
const controller = new DonationRequestController()

router.use(verifyToken("access")) // apply middleware to all routes

/*--- DonationRequest Routes ---*/
router.post('/request', [
    ...validateDonationRequestInput, requireBody, validate
],
    controller.createDonationRequest.bind(controller)); // Create a new blood donation request

router.post('/request/other-person', [
    ...validateDonationRequestInputForSomeoneElse, requireBody, validate
],
    controller.createDonationRequest.bind(controller)); // Create a new blood donation request for someone else

router.get('/request/confirm-availability',) // Confirm donor's availability
router.get('/request/open', controller.getOpenDonationRequests.bind(controller)) // Get all open donation requests
router.get('/request/me', controller.getUserDonationRequests.bind(controller)) // Get user donation requests
router.get('/request/:requestID', controller.getDonationRequest.bind(controller)) 
router.patch('/request/:requestID', requireBody, [validate])
router.delete('/request/:requestID',)

/*--- Donation Routes ---*/
router.post('/', [requireBody, validate]); // Create a new donation
router.get('/all',) // Get all donations
router.get('/:donationID',)
router.patch('/:donationID', requireBody, [validate])
router.delete('/:donationID',)

export default router;

