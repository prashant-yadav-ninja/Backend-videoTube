import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { likeStatus } = req.query;
  //TODO: toggle like on video
  if (!videoId) {
    throw new ApiError(400, "Something went wrong while getting videoId");
  }

  let like = await Like.find({ video: videoId });
  let message = "video have been ";

  console.log(like);

  if (!like?.length) {
    like = await Like.create({
      video: videoId,
      likedBy: req.user._id,
      likeVal: likeStatus,
    });
    message += likeStatus;
  } else if (like[0].likeVal === likeStatus) {
    await Like.findByIdAndDelete(like[0]._id);

    message += "neither like/dislike";

    // like[0].likeVal = null
    // await like[0].save()
  } else {
    like[0].likeVal = likeStatus;
    await like[0].save();

    message += likeStatus;
  }

  return res.status(200).json(new ApiResponse(200, {}, message));
});

const currentVideoLikeStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "something went wrong while getting videoId");
  }

  const currStatusLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  console.log(currStatusLike);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        currStatusLike ? currStatusLike.likeVal : null,
        "current status"
      )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const { likeStatus } = req.query;
  if (!commentId) {
    throw new ApiError(400, "Something went wrong while getting commentId");
  }

  let like = await Like.find({ comment: commentId });
  let message = "comment have been ";

  console.log(like);

  if (!like?.length) {
    like = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
      likeVal: likeStatus,
    });
    message += likeStatus;
  } else if (like[0].likeVal === likeStatus) {
    await Like.findByIdAndDelete(like[0]._id);

    message += "neither like/dislike";

    // like[0].likeVal = null
    // await like[0].save()
  } else {
    like[0].likeVal = likeStatus;
    await like[0].save();

    message += likeStatus;
  }

  return res.status(200).json(new ApiResponse(200, {}, message));
});

const currentCommentLikeStatus = asyncHandler(async(req,res)=>{
    const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "something went wrong while getting commentId");
  }

  const currStatusLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  console.log(currStatusLike);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        currStatusLike ? currStatusLike.likeVal : null,
        "current status"
      )
    );
})

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const { likeStatus } = req.query;
  if (!tweetId) {
    throw new ApiError(400, "Something went wrong while getting tweetId");
  }

  let like = await Like.find({ tweet: tweetId });
  let message = "post have been ";

  console.log(like);

  if (!like?.length) {
    like = await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
      likeVal: likeStatus,
    });
    message += likeStatus;
  } else if (like[0].likeVal === likeStatus) {
    await Like.findByIdAndDelete(like[0]._id);

    message += "neither like/dislike";

    // like[0].likeVal = null
    // await like[0].save()
  } else {
    like[0].likeVal = likeStatus;
    await like[0].save();

    message += likeStatus;
  }

  return res.status(200).json(new ApiResponse(200, {}, message));
});

const currentTweetLikeStatus = asyncHandler(async(req,res)=>{
    const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "something went wrong while getting tweetId");
  }

  const currStatusLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  console.log(currStatusLike);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        currStatusLike ? currStatusLike.likeVal : null,
        "current status"
      )
    );
})

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likesVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        likeVal: "like",
        // comment: null,
        // tweet: null,
        video: { $ne: null },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetail",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "userDetail",
              pipeline: [
                {
                  $project: {
                    username: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $unwind: "$videoDetail",
    },
    {
      $unwind: "$videoDetail.userDetail",
    },
    {
      $project: {
        _id: 0,
        videoId: "$video",
        duration: "$videoDetail.duration",
        thumbnail: "$videoDetail.thumbnail",
        description: "$videoDetail.description",
        owner: "$videoDetail.userDetail.username",
      },
    },
  ]);

  // console.log(likesVideos)

  return res
    .status(200)
    .json(new ApiResponse(200, likesVideos, "Likes Videos"));
});

export {
  toggleVideoLike,
  currentVideoLikeStatus,
  toggleCommentLike,
  currentCommentLikeStatus,
  toggleTweetLike,
  currentTweetLikeStatus,
  getLikedVideos,
};
