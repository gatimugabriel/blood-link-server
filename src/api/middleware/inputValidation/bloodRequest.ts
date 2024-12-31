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
    check("requestLocation", "Request Location is Required").isObject().withMessage("Invalid location"),
]

export const validateDonationRequestInputForSomeoneElse = [
    check("bloodGroup", "Blood Group is Required").notEmpty().withMessage("you need the  'bloodGroup' input"),
    check("units", "Number of units is Required").notEmpty().withMessage("you need the  'units' input"),
    check("healthFacility", "Health Facility name is Required").notEmpty().withMessage("you need the  'healthFacility' input"),
    check("patientName", "Patient Name is Required").notEmpty().withMessage("you need the  'patientname' input"),
    check("gender", "Gender is Required").notEmpty().withMessage("you need the  'gender' input"),
    check("requestLocation", "Request Location is Required").isObject().withMessage("Invalid location"),
    check("requestingFor", "Requesting For is Required")
        .notEmpty().withMessage("you need the  'requestingFor' input")
        .equals("other").withMessage("requestingFor must be 'other' for this type of request")
]
