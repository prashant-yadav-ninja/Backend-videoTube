import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(400, "Something went wrong to process the videoId");
  }

  const commentOnVideo = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "videoComments",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "commentUserDetail",
            },
          },
          {
            $unwind: "$commentUserDetail",
          },
        ],
      },
    },
    {
      $unwind: "$videoComments",
    },
    {
      $project: {
        _id: 0,
        userCommentId: "$videoComments.commentUserDetail._id",
        userUsername: "$videoComments.commentUserDetail.username",
        userAvatar: "$videoComments.commentUserDetail.avatar",
        commentId: "$videoComments._id",
        commentContent: "$videoComments.content",
      },
    },
    {
      $skip: (page - 1) * parseInt(limit),
    },
    {
      $limit: parseInt(limit),
    },
  ]);

  if (!commentOnVideo.length) {
    throw new ApiError(404, "Video not Exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, commentOnVideo, "all comments of video"));
});
const getCommentComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { commentId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!commentId) {
    throw new ApiError(400, "Something went wrong while getting commentId");
  }

  const replyofComment = await Comment.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(commentId),
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "parentComment",
        as: "replyOnComment",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "userDetail",
            },
          },
          {
            $unwind: "$userDetail",
          },
        ],
      },
    },
    {
      $unwind: "$replyOnComment",
    },
    {
      $project: {
        _id: 0,
        userCommentId: "$replyOnComment.userDetail._id",
        userUsername: "$replyOnComment.userDetail.username",
        userAvatar: "$replyOnComment.userDetail.avatar",
        commentId: "$replyOnComment._id",
        commentContent: "$replyOnComment.content",
      },
    },
    {
      $skip: (page - 1) * parseInt(limit),
    },
    {
      $limit: parseInt(limit),
    },
  ]);

  if (!replyofComment.length) {
    throw new ApiError(404, "Comment Not Exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, replyofComment, "reply on comment"));
});
const getTweetComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a Tweet
  const { tweetId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!tweetId) {
    throw new ApiError(400, "Something went wrong while getting tweetId");
  }

  const tweetComment = await Tweet.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(tweetId),
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "tweetComments",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "userDetail",
            },
          },
          {
            $unwind: "$userDetail",
          },
        ],
      },
    },
    {
      $unwind: "$tweetComments",
    },
    {
      $project: {
        _id: 0,
        userCommentId: "$tweetComments.userDetail._id",
        userUsername: "$tweetComments.userDetail.username",
        userAvatar: "$tweetComments.userDetail.avatar",
        commentId: "$tweetComments._id",
        commentContent: "$tweetComments.content",
      },
    },
    {
      $skip: (page - 1) * parseInt(limit),
    },
    {
      $limit: parseInt(limit),
    },
  ]);

  if (!tweetComment.length) {
    throw new ApiError(404, "Comment Not Exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweetComment, "reply on comment"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment either to a video , tweet , as a form of reply
  // make sure in frontend that at specifie query is passed with in route

  const { videoId, tweetId, commentId } = req.query; // here i expect id of video , tweet , comment is coming

  const { commentText } = req.body;

  if (!videoId && !tweetId && !commentId) {
    throw new ApiError(
      400,
      "Something went wrong while processing the comment"
    );
  }

  if (!commentText.trim()) {
    throw new ApiError(400, "Content is requried");
  }

  // Validate the existence of the video, tweet, or comment
  if (videoId) {
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
      throw new ApiError(400, "Video not found");
    }
  }

  if (tweetId) {
    const tweetExists = await Tweet.findById(tweetId);
    if (!tweetExists) {
      throw new ApiError(400, "Tweet not found");
    }
  }

  if (commentId) {
    const parentCommentExists = await Comment.findById(commentId);
    if (!parentCommentExists) {
      throw new ApiError(400, "Comment not found");
    }
  }

  const comment = await Comment.create({
    content: commentText,
    owner: req.user._id,
    video: videoId ? videoId : null,
    tweet: tweetId ? tweetId : null,
    parentComment: commentId ? commentId : null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "comment have been done"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment

  const { commentId } = req.params;

  const { commentText } = req.body;

  if (!commentId) {
    throw new ApiError(400, "something went wrong while getting commentId");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(500, "Comment Not Exist");
  }

  //   if (comment.video) {
  //     console.log(comment.video);
  //   }

  //   console.log(comment.video, " ", typeof comment.video);

  if (!commentText.trim()) {
    throw new ApiError(400, "Content is requried");
  }

  comment.content = commentText;

  await comment.save();

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "comment have been done"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "something went wrong while getting commentId");
  }

  const comment = await Comment.findByIdAndDelete(commentId);

  if (!comment) {
    throw new ApiError(500, "Comment Not Exist");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "comment have been delted"));
});

export {
  getVideoComments,
  getTweetComments,
  getCommentComments,
  addComment,
  updateComment,
  deleteComment,
};
