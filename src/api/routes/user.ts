import {Router} from 'express';
import {UserController} from '../controller/userController';
import validationMiddleware from "../middleware/inputValidation/index";
import {verifyToken} from "../middleware/auth";
import {validateCoords} from "../middleware/inputValidation/user";

const router = Router()
const userController = new UserController()
const {requireBody, validate, validateRangeBody} = validationMiddleware;

router.post('/insertMany', userController.insertManyUsers.bind(userController))

router.use(verifyToken("access"))
// authenticate all routes below

router.post('/fcm-token', userController.saveFcmToken.bind(userController))

router.route('/location').post(
    [
        requireBody,
        ...validateCoords,
        validate
    ], userController.setLocation
).put(
    [
        requireBody,
        ...validateCoords,
        validate
    ], userController.setLocation
);

//  -- User Profile Routes -- //
router.route('/').get(userController.getUser.bind(userController))

router.get('/range', [requireBody, ...validateRangeBody, validate], userController.getUsersWithinRange.bind(userController))// get users within a given range(radius)

export default router;
