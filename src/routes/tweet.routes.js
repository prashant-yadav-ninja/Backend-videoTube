import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/createtweet")
  .post(
    verifyJWT,
    upload.fields([{ name: "tweetImage", maxCount: 1 }]),
    createTweet
  );

router.route("/gettweets/:userId").get(getUserTweets);

router.route("/updatetweet/:tweetId").post(verifyJWT, updateTweet);

router.route('/deletetweet/:tweetId').post(verifyJWT,deleteTweet)

export default router;
