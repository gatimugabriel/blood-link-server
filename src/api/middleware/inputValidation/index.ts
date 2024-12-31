import {validationResult} from "express-validator";
import {NextFunction, Request, Response} from "express";
import {
    validateAddressInputs,
    validatePasswordInput,
    validateRangeBody,
    validateRefreshBody,
    validateMobileVerification,
    validateEmailVerification,
    validateSignupInputs
} from "./user";
import {validateDonationRequestInput, validateDonationRequestInputForSomeoneElse} from "./bloodRequest";


const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }
    next();
};

const requireBody = (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        res.status(400);
        throw new Error("Request body is missing");
    }
    next()
}

const validationMiddleware = {
    //  user
    validateMobileVerification,
    validateEmailVerification,
    validateSignupInputs,
    validateRefreshBody,
    validatePasswordInput,
    validateAddressInputs,
    validateRangeBody,

    // donation request
    validateDonationRequestInput,
    validateDonationRequestInputForSomeoneElse,

    validate, requireBody
}

export default validationMiddleware
