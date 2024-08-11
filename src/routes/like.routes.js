import { Router } from "express";
import {
  currentTweetLikeStatus,
  currentVideoLikeStatus,
  getLikedVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/togglevideolike/:videoId").post(toggleVideoLike);

router.route("/togglecommentlike/:commentId").post(toggleCommentLike);

router.route("/toggletweetlike/:tweetId").post(toggleTweetLike);

router.route("/likevideos").get(getLikedVideos);

router.route("/videolikestaus/:videoId").get(currentVideoLikeStatus);

router.route("/commentlikestatus/:commentId").get(currentVideoLikeStatus);

router.route("/tweetlikestatus/:tweetId").get(currentTweetLikeStatus);

export default router;
