import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { userRegistrationValidator } from "../validator/index.js";
import { validate } from "../middlewares/validator.middleware.js";
import { fileUpload } from "../middlewares/multer.middleware.js";
const router = Router();
router
  .route("/register")
  .post(fileUpload, userRegistrationValidator(), validate, registerUser);
export default router;
