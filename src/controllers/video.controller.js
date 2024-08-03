import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";

const publishAvideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (title?.trim() === "" || description?.trim() === "") {
    throw new ApiError(401, "Title and Description are requried Fields");
  }

  //   console.log(title, " ", description, "coming from publishAvideo");

  //   console.log(req.files);

  const videoFileLocalPath = req.files?.videoFile?.[0].path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0].path;

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(
      400,
      "video and thumbnail are requrired to upload the video"
    );
  }

  let videoFile, thumbnail;

  try {
    videoFile = await uploadOnCloudinary(videoFileLocalPath);
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    // console.log(videoFile, thumbnail);

    if (!videoFile) {
      throw new ApiError(500, "Something went wrong while uploading video");
    }

    if (!thumbnail) {
      throw new ApiError(500, "Something went wrong while uploading thumbnail");
    }

    const video = await Video.create({
      videoFile: videoFile.url,
      duration: videoFile.duration,
      description,
      title,
      thumbnail: thumbnail.url,
      owner: req.user._id,
    });

    return res
      .status(200)
      .json(new ApiResponse(201, video, "video successfully uploaded"));
  } catch (error) {
    if (videoFile) {
      await deleteFromCloudinary(videoFile);
    }

    if (thumbnail) {
      await deleteFromCloudinary(thumbnail);
    }
    throw new ApiError(500, error.message);
  }
});

const getVideoById = asyncHandler(async (req, res) => {

  // here i make functionality that when the user if login try to see the video then in watchHistory video is added

  const { videoId } = req.params;

  if(!videoId){
    throw new ApiError(400,'Please refresh the page not getting videoId')
  }

  // console.log(videoId, "coming from params");

  const video = await Video.findById(videoId)

  if(!video){
    throw new ApiError(404,'video not found')
  }

  const refreshToken = req.cookies?.refreshToken;

  console.log(refreshToken,'this is refresh Token')

  if (refreshToken) {
    const user = await User.findOne({ refreshToken });

    if (!user) {
      throw new ApiError(404, "Unauthorized to access or Invalid Credential");
    }

    // const videoObjectid = new mongoose.Types.ObjectId(videoId);

    // user.watchHistory.push({video:videoObjectid});

    await user.addVideoandUpdateWatchHistory(videoId)

    await user.save();
  }

  console.log(video);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video get successfully"));
});

const getAllvideos = asyncHandler(async (req, res) => {
  // get the username
  // validate the username
  // find the username exist channel or not
  // in each video document there is owner

  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "asc",
    username,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination

  if (!username) {
    throw new ApiError(404, "Username is requrired");
  }

  const user = await User.findOne({ username });

  if (!user) {
    throw new ApiError(404, "User Not Exist");
  }

  console.log(username, "from req.query");

  const userVideoUploaded = await User.aggregate([
    {
      $match: {
        username: username,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "uploadedVideos",
      },
    },
    {
      $unwind: "$uploadedVideos",
    },
    {
      $match: {
        "uploadedVideos.title": { $regex: query || "", $options: "i" },
      },
    },
    {
      $sort: {
        [`uploadedVideos.${sortBy}`]: sortType === "asc" ? 1 : -1,
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: parseInt(limit),
    },
    {
      $group: {
        _id: {
          _id: "$_id",
          username: "$username",
          avatar: "$avatar",
          coverImage: "$coverImage",
        },
        uploadedVideos: { $push: "$uploadedVideos" },
      },
    },
    {
      $project: {
        _id: "$_id._id",
        username: "$_id.username",
        avatar: "$_id.avatar",
        coverImage: "$_id.coverImage",
        uploadedVideos: 1,
      },
    },

    // {
    //   $project: {
    //     username: 1,
    //     avatar: 1,
    //     coverImage: 1,
    //     uploadedVideos: 1,
    //   },
    // },
  ]);

  if (userVideoUploaded.length == 0) {
    throw new ApiError(400, "channel with username not exist");
  }

  console.log(
    userVideoUploaded,
    " , and this is lenght ,",
    userVideoUploaded.length
  );

  return res
    .status(200)
    .json(new ApiResponse(200, userVideoUploaded, "videos uploaded by user"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail

  const { videoId } = req.params;

  const { title, description } = req.body;

  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!title && !description && !thumbnailLocalPath) {
    throw new ApiError(
      400,
      "At least one field (title, description, thumbnail) must be provided to update the video"
    );
  }

  if (!videoId) {
    throw new ApiError(400, "Something went wrong while getting videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video Not Found");
  }

  if (title) video.title = title;
  if (description) video.description = description;

  let thumbnail, oldthumbnail;

  try {
    if (thumbnailLocalPath) {
      thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
      if (!thumbnail) {
        throw new ApiError(
          500,
          "Something went wrong while uploading thumbnail"
        );
      }
      oldthumbnail = video.thumbnail;

      video.thumbnail = thumbnail.url;

      if (oldthumbnail) {
        let publicidthumbnail = oldthumbnail.split("/");
        publicidthumbnail =
          publicidthumbnail[publicidthumbnail.length - 1].split(".")[0];
        await deleteFromCloudinary(publicidthumbnail);
      }

      await deleteFromCloudinary(oldthumbnail);
    }

    await video.save();

    return res
      .status(201)
      .json(
        new ApiResponse(201, {}, `video ${videoId} get updated successfully`)
      );
  } catch (error) {
    console.log(error);
    if (thumbnail) await deleteFromCloudinary(thumbnail.public_id);
    throw new ApiError(500, error.message);
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Something went wrong while getting videoId");
  }

  const deleteddoc = await Video.findByIdAndDelete(videoId);

  console.log(deleteddoc);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video get deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Something went wrong while getting videoId");
  }

  const video = await Video.findById(videoId);

  video.isPublished = !video.isPublished;

  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, `video published status :${video.isPublished}`)
    );
});

export {
  publishAvideo,
  getVideoById,
  getAllvideos,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
