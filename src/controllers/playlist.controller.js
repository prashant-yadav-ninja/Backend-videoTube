import mongoose from "mongoose";
import { PlayList } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  console.log(name, description);
  //TODO: create playlist
  if (!name && !description) {
    throw new ApiError(
      400,
      "name and description required for creating playlist"
    );
  }

  await PlayList.create({
    name,
    description,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, {}, `${name} playlist created`));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!userId) {
    throw new ApiError(400, "something went wrong while getting userId");
  }

  const playlists = await PlayList.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        name: 1,
        updatedAt: 1,
        videos: 1,
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, playlists, "user playlist"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!playlistId) {
    throw new ApiError(400, "something went wrong while getting playlistId");
  }

  const playlist = await PlayList.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist Not Exist");
  }

  return res.status(200).json(new ApiResponse(200, playlist, "playlist"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !videoId) {
    throw new ApiError(400, "give valid video to add to valid playlist");
  }

  const playlist = await PlayList.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "playlist not exist");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video not exist");
  }

  playlist.videos.push(videoId);

  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video have been added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  console.log(typeof videoId, "coming from params");

  if (!playlistId || !videoId) {
    throw new ApiError(
      400,
      "something went wrong while getting playlistId and videoId"
    );
  }

  const playlist = await PlayList.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist Not Found");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video Not Found");
  }

  playlist.videos = playlist.videos.filter(
    (video) => video.toString() !== videoId
  );

  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video remove from playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!playlistId) {
    throw new ApiError(400, "something went wrong while getting playlistid");
  }

  const playlist = await PlayList.findByIdAndDelete(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist Not Exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!playlistId) {
    throw new ApiError(400, "something went wrong while getting playlistId");
  }

  if (!name && !description) {
    throw new ApiError(
      400,
      "For update either name or description is required"
    );
  }

  const playlist = await PlayList.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist Not Found");
  }

  if (name) {
    playlist.name = name;
  }

  if (description) {
    playlist.description = description;
  }

  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "playlist get updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
