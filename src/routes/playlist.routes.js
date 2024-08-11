import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/createplaylist").post(verifyJWT, createPlaylist);

router.route("/getplaylists/:userId").get(getUserPlaylists);

router.route("/getplaylist/:playlistId").get(getPlaylistById);

router
  .route("/addvideoToplaylist/:videoId/:playlistId")
  .patch(verifyJWT, addVideoToPlaylist);

router
  .route("/removevideoFromplaylist/:videoId/:playlistId")
  .patch(verifyJWT, removeVideoFromPlaylist);

router.route("/deleteplaylist/:playlistId").post(verifyJWT, deletePlaylist);

router.route("/updateplaylist/:playlistId").patch(verifyJWT, updatePlaylist);

export default router;
