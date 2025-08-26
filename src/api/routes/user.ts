import { Router } from 'express';
import { UserController } from '../controller/userController';
import validationMiddleware from "../middleware/inputValidation/index";
import { authenticate } from "../middleware/auth/auth.middleware";
import { validateCoords } from "../middleware/inputValidation/user";
import { validateProfileUpdate } from "../middleware/inputValidation/profile";

const router = Router()
const userController = new UserController()
const { requireBody, validate, validateRangeBody } = validationMiddleware;

router.post('/insertMany', userController.insertManyUsers.bind(userController))

router.use(authenticate)

router.post('/fcm-token', userController.saveFcmToken.bind(userController))

router.post('/location', [requireBody, ...validateCoords, validate], userController.setLocation.bind(userController))
router.put('/location', [requireBody, ...validateCoords, validate], userController.setLocation.bind(userController))

router.get('/range', [requireBody, ...validateRangeBody, validate], userController.getUsersWithinRange.bind(userController))// get users within a given range(radius)

//  -- User Profile Routes -- //
router.get("/all", userController.listUsers.bind(userController))
router.route('/')
  .get(userController.getUser.bind(userController))
  .patch([requireBody, ...validateProfileUpdate, validate], userController.updateUser.bind(userController))
router.get('/stats', userController.getUserStats.bind(userController))

export default router;
