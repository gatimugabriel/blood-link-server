import {Router} from 'express';
import {UserController} from '../controller/userController';
import validationMiddleware from "../middleware/inputValidation/index";
import {verifyToken} from "../middleware/auth";

const router = Router()
const userController = new UserController()
const {requireBody, validate, validateRangeBody} = validationMiddleware;

router.post('/insertMany', userController.insertManyUsers.bind(userController))

router.use(verifyToken("access"))
// authenticate all routes below

router.post('/fcm-token', userController.saveFcmToken.bind(userController))

// router.route('/set-address').post(
//     [
//         inputValidationMiddleware.requireBody,
//         ...inputValidationMiddleware.addressInputs,
//         inputValidationMiddleware.validate
//     ], userController.setAddress
// ).put(
//     [
//         inputValidationMiddleware.requireBody,
//         ...inputValidationMiddleware.addressInputs,
//         inputValidationMiddleware.validate
//     ], userController.updateAddress
// );

//  -- User Profile Routes -- //
router.route('/').get(userController.getUser.bind(userController))

router.get('/range', [requireBody, ...validateRangeBody, validate], userController.getUsersWithinRange.bind(userController))// get users within a given range(radius)

export default router;
