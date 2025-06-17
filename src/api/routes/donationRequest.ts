import {Router} from "express";
import validationMiddleware from "../middleware/inputValidation/index";
import {DonationRequestController} from "../controller/donationRequestController";
import { authenticate } from "../middleware/auth/auth.middleware";

const router = Router();
const {
    validateDonationRequestInput,
    validateDonationRequestInputForSomeoneElse,
    requireBody,
    validate
} = validationMiddleware;
const controller = new DonationRequestController()

router.get('/', controller.fetchDonationRequests.bind(controller));
router.route('/:id')
    .get(controller.getDonationRequest.bind(controller))
    .patch(authenticate, [requireBody, validate], controller.updateDonationRequest.bind(controller))
    .delete(authenticate, controller.deleteDonationRequest.bind(controller));

router.get('/me', controller.getUserDonationRequests.bind(controller)) // Get user donation requests

// ---- CREATE ---//
router.use(authenticate)
router.post('/', [
        ...validateDonationRequestInput, requireBody, validate
    ],
    controller.createDonationRequest.bind(controller)); // Create a new blood donation request for SELF

router.post('/other-person', [
        ...validateDonationRequestInputForSomeoneElse, requireBody, validate
    ],
    controller.createDonationRequest.bind(controller)); // Create a new blood donation request for someone else (OTHER)

export default router;