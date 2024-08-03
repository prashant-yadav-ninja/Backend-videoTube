import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  // i expect that user must have either image or text to post

  const { tweetText } = req.body;

  //   console.log(tweet, " , from reqbody");
  const tweetLocalPath = req.files?.tweetImage?.[0].path;

  if (!tweetText?.trim() && !tweetLocalPath) {
    throw new ApiError(400, `Either tweet/tweetImage is required to tweet `);
  }

  let tweet;

  try {
    if (tweetLocalPath) {
      tweet = await uploadOnCloudinary(tweetLocalPath);
    }

    const tweetPost = await Tweet.create({
      content: tweetText ? tweetText : "",
      owner: req.user._id,
      imagePost: tweet ? tweet.url : "",
    });

    return res
      .status(201)
      .json(new ApiResponse(201, tweetPost, "tweet have been posted"));
  } catch (error) {
    // console.log(error);
    if (tweet) {
      await deleteFromCloudinary(tweet.public_id);
    }
    throw new ApiError(500, "Internal Server Error");
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  // i want that any one can see the user tweets

  const { userId } = req.params;

  console.log(userId);

  if (!userId) {
    throw new ApiError(400, "something went wrong while getting userId");
  }

  const tweets = await Tweet.find({ owner: userId }).select(
    " -createdAt -updatedAt -__v -owner"
  );

  console.log(tweets);

  return res.status(200).json(new ApiResponse(200, tweets, "user tweets"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet

  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "something went wrong while getting tweetId");
  }

  const { tweetText } = req.body;

  if (!tweetText.trim()) {
    throw new ApiError(400, "please make sure to tweet");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Something went wrong please refresh page");
  }

  tweet.content = tweetText;

  await tweet.save();

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Tweet Updated Successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "something went wrong while getting tweetId");
  }

  const tweet = await Tweet.findByIdAndDelete(tweetId);

  if (!tweet) {
    throw new ApiError(
      404,
      "Something went wrong while getting tweet please refresh"
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Tweet Deleted Successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
