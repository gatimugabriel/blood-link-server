import { validationResult } from "express-validator";
import { NextFunction, Request, Response } from "express";
import {
    validateAddressInputs,
    validatePasswordInput,
    validateRangeBody,
    validateRefreshBody,
    validateMobileVerification,
    validateEmailVerification,
    validateSignupInputs
} from "./user";
import { validateDonationRequestInput, validateDonationRequestInputForSomeoneElse, validateUpdateDonationRequest } from "./bloodRequest";


const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    next();
};

const requireBody = (req: Request, res: Response, next: NextFunction) => {
    if (Object.keys(req.body).length === 0) {
        return res.status(422).json({ message: "request body cannot be empty" });

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
    validateUpdateDonationRequest,

    validate, requireBody
}

export default validationMiddleware
