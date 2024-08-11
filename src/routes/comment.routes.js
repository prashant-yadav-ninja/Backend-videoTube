import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  getCommentComments,
  getTweetComments,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.route("/addcomment").post(verifyJWT, addComment);

router.route("/updatecomment/:commentId").post(verifyJWT, updateComment);

router.route("/deletecomment/:commentId").post(verifyJWT, deleteComment);

router.route('/videocomment/:videoId').get(getVideoComments)

router.route('/tweetcomment/:tweetId').get(getTweetComments)

router.route('/replycomment/:commentId').get(getCommentComments)

export default router;
