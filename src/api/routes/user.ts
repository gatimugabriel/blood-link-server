import {Router} from 'express';
import {UserController} from '../controller/userController';
import validationMiddleware from "../middleware/inputValidation/index";
import {authenticate} from "../middleware/auth/auth.middleware";
import {validateCoords} from "../middleware/inputValidation/user";

const router = Router()
const userController = new UserController()
const {requireBody, validate, validateRangeBody} = validationMiddleware;

router.post('/insertMany', userController.insertManyUsers.bind(userController))

router.use(authenticate)
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
router.get("/all", userController.listUsers.bind(userController))
router.route('/').get(userController.getUser.bind(userController))

router.get('/range', [requireBody, ...validateRangeBody, validate], userController.getUsersWithinRange.bind(userController))// get users within a given range(radius)

export default router;
