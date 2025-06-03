import { body } from "express-validator";
const userRegistrationValidator = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email Can't be empty")
      .trim()
      .isEmail()
      .withMessage("Email is invalid"),
    body("username")
      .notEmpty()
      .withMessage("Username cannot be empty")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username cannot be less than 3 characters")
      .isLength({ max: 13 })
      .withMessage("Username cannot exceed 13 characters"),
    body("password")
      .notEmpty()
      .withMessage("Password cannot be empty")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Password cannot be less than 5 characters"),
    body("fullname")
      .notEmpty()
      .withMessage("fullname cannot be empty")
      .trim()
      .isLength({ min: 5 })
      .withMessage("fullname cannot be less than 5 characters"),
  ];
};

const userLoginValidator = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email cant be empty")
      .trim()
      .isEmail()
      .withMessage("Email is invalid"),
    body("password").notEmpty().withMessage("password cant be empty").trim(),
    body("username").notEmpty().withMessage("username cant be empty").trim(),
  ];
};

export { userRegistrationValidator, userLoginValidator };
