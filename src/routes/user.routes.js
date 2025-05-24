import { Router } from "express";
import {
  loginUser,
  logOutUser,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { userRegistrationValidator } from "../validator/index.js";
import { validate } from "../middlewares/validator.middleware.js";
const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  userRegistrationValidator(),
  validate,
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(logOutUser);
export default router;
