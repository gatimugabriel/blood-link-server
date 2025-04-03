import {Router} from "express";
import {AuthController} from "../controller/authController";
import {authenticate, validateRefreshToken} from "../middleware/auth/auth.middleware";
import validationMiddleware from "../middleware/inputValidation";

const router = Router();
const authController = new AuthController();
const {requireBody, validateMobileVerification, validateEmailVerification, validateSignupInputs, validateRefreshBody, validate} = validationMiddleware;

// Phone & Email Verification
router.post('/send-phone-verification', [requireBody, ...validateMobileVerification, validate], authController.requestMobileVerification.bind(authController));
router.post('/send-email-verification', [requireBody, ...validateEmailVerification, validate], authController.requestMobileVerification.bind(authController));
router.post('/verify-code', [requireBody, validate], authController.verifyMobileCode.bind(authController));


router.post('/signup', [requireBody, ...validateSignupInputs, validate], authController.signup.bind(authController));
router.post('/signin', requireBody, authController.signin.bind(authController));
router.post('/signout', [
    requireBody, ...validateRefreshBody, validate,
    validateRefreshToken
], authController.signout.bind(authController));

router.post('/refresh', [
    requireBody, ...validateRefreshBody, validate,
    validateRefreshToken
], authController.refreshToken.bind(authController));

export default router;

