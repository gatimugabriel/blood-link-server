import { body } from 'express-validator';

export const validateProfileUpdate = [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),

  body('bloodGroup')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Please provide a valid blood group'),

  body('age')
    .optional()
    .isNumeric()
    .withMessage('Age must be a number'),

  // body('address')
  //   .optional()
  //   .isLength({ min: 5, max: 100 })
  //   .withMessage('Address must be between 5 and 100 characters'),

  // body('city')
  //   .optional()
  //   .isLength({ min: 2, max: 50 })
  //   .withMessage('City must be between 2 and 50 characters'),

  // body('state')
  //   .optional()
  //   .isLength({ min: 2, max: 50 })
  //   .withMessage('State must be between 2 and 50 characters'),

  // body('zip')
  //   .optional()
  //   .isPostalCode('any')
  //   .withMessage('Please provide a valid zip code'),

  // body('country')
  //   .optional()
  //   .isLength({ min: 2, max: 50 })
  //   .withMessage('Country must be between 2 and 50 characters'),
];