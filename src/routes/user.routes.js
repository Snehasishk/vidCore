import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logOutUser,
  refreshAccessToken,
  registerUser,
  updateCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { userRegistrationValidator } from "../validator/index.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
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
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateCurrentUser);
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/update-coverimage")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);
export default router;
