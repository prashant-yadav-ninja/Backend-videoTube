import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getAllvideos,
  getVideoById,
  publishAvideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";

const router = Router();

router.route("/upload").post(
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAvideo
);

router.route("/getVideoById/:videoId").get(getVideoById);

router.route('/getAllvideos').get(getAllvideos)

router
  .route("/update/:videoId")
  .patch(
    verifyJWT,
    upload.fields([{ name: "thumbnail", maxCount: 1 }]),
    updateVideo
  );

router.route('/delete/:videoId').post(verifyJWT,deleteVideo)
router.route('/published/:videoId').patch(verifyJWT,togglePublishStatus)

export default router;
