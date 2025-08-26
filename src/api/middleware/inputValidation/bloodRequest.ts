import { check, body } from "express-validator";

export const validateDonationRequestInput = [
    // reject bloodgroup in self request
    body("bloodGroup")
        .custom((value, { req }) => {
            if (req.body.hasOwnProperty("bloodGroup")) {
                throw new Error("The 'bloodGroup' field is not allowed for self requests. Please remove the item and try again");
            }
            return true
        }),
    check("units", "Number of units is Required").notEmpty().withMessage("you need the  'units' input"),
    check("requestLocation", "Request Location is Required").isObject().withMessage("Invalid requestLocation"),
]

export const validateDonationRequestInputForSomeoneElse = [
    check("bloodGroup", "Blood Group is Required").notEmpty().withMessage("Blood group is required"),
    check("units", "Number of units is Required").notEmpty().withMessage("you need the  'units' input"),
    check("healthFacility", "Health Facility name is Required").notEmpty().withMessage("you need the  'healthFacility' input"),
    check("patientName", "Patient Name is Required").notEmpty().withMessage("you need the  'patientname' input"),
    check("gender", "Gender is Required").notEmpty().withMessage("you need the  'gender' input"),
    check("requestLocation", "Request Location is Required").isObject().withMessage("Invalid requestLocation"),
    check("requestingFor", "Requesting For is Required")
        .notEmpty().withMessage("you need the  'requestingFor' input")
        .equals("other").withMessage("requestingFor must be 'other' for this type of request")
]

export const validateUpdateDonationRequest = [
    check("status")
        .optional()
        .isIn(['open', 'fulfilled', 'closed'])
        .withMessage("Status must be one of: open, fulfilled, closed"),
    check("urgency")
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage("Urgency must be one of: low, medium, high"),
    check("units")
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage("Units must be a number between 1 and 10"),
    check("healthFacility")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Health facility name must be between 2 and 100 characters"),
    check("patientName")
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage("Patient name must be between 2 and 50 characters"),
    check("mobileNumber")
        .optional()
        .isMobilePhone("any")
        .withMessage("Invalid mobile number format"),
    check("stringRequestLocation")
        .optional()
        .isLength({ min: 2, max: 200 })
        .withMessage("Location description must be between 2 and 200 characters")
]
