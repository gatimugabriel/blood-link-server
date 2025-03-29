import {check} from "express-validator";

export const validateMobileVerification = [
    check("phoneNumber", "Phone Number is Required").isMobilePhone("en-KE").withMessage("Invalid phone number"),
]

export const validateEmailVerification = [
    check("email", "Please include a valid email").isEmail(),
]

export const validateSignupInputs = [
    check("firstName", "First Name is Required").isLength({ min: 3 }).withMessage("Name should be at least 3 characters"),
    check("lastName", "Last Name is Required").isLength({ min: 3 }).withMessage("Name should be at least 3 characters"),
    check("email", "Please include a valid email").isEmail(),
    // check("phone", "Phone is Required").isMobilePhone("en-KE").withMessage("Invalid phone number"),
    check("bloodGroup", "Your Blood Group is Required").isLength({ max: 2, min:1 }).withMessage("Invalid blood group"),
    check("primaryLocation", "Your Primary Location is Required").isObject().withMessage("Invalid primary requestLocation"),
    check("confirmPassword", "Confirm password is required")
        .not().isEmpty()
        .isLength({ min: 6 })
        .withMessage("Password should be at least 6 characters long")
        .isStrongPassword()
        .withMessage(
            "Password should contain an uppercase and lowercase letters, a number, and a special characters"
        ),
]

export const validatePasswordInput = [
    check("password", "Password is required")
        .not().isEmpty()
        .isLength({ min: 6 })
        .withMessage("Password should be at least 6 characters long")
        .isStrongPassword()
        .withMessage(
            "Password should have both uppercase and lowercase letters, numbers, and special characters"
        ),
];

export const validateRefreshBody = [
    check("refreshToken", "Refresh token is required").not().isEmpty(),
]

// User Locations
export const validateAddressInputs = [
    check("primaryLocation", "Primary requestLocation is required").not().isEmpty(),
    // check("town", "Town is required").not().isEmpty(),
    // check("street", "Street Address is required").not().isEmpty(),
    // check("phoneNumber", "Phone number is required").not().isEmpty(),
]

export const validateCoords= [
    check("latitude", "latitude is required").not().isEmpty().isNumeric().withMessage("Co-ordinate point must be a number"),
    check("longitude", "longitude is required").not().isEmpty().isNumeric().withMessage("Co-ordinate point must be a number"),
]

export const validateRangeBody =[
    check("latitude", "latitude is required").not().isEmpty().isNumeric().withMessage("Co-ordinate point must be a number"),
    check("longitude", "longitude is required").not().isEmpty().isNumeric().withMessage("Co-ordinate point must be a number"),
    check("radius", "radius is required").not().isEmpty().isNumeric().withMessage("radius/range distance must be a number")
]
