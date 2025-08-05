import { Router } from "express";
import {
    UpdateUserAvatar,
    changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAccountDetails,
    updateCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

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
    registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);

// get because not taking data from frontend only data is send to frontend
router.route("/get-current-user").get(verifyJwt, getCurrentUser);

// using patch for updating the details 
router.route("/update-details").patch(verifyJwt, updateAccountDetails);

router.route("/change-avatar").patch(
    verifyJwt,
    upload.single("avatar"),
    UpdateUserAvatar
);


router.route("/update-cover-image").patch(
    verifyJwt,
    upload.single("coverImage"),
    updateCoverImage
)

router.route("/c/:username").get(verifyJwt,getUserChannelProfile);

router.route("/history").get(verifyJwt,getWatchHistory)

export default router;
