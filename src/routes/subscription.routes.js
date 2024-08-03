import { Router } from "express";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggle-subscription/:channelId").post(toggleSubscription);
router.route('/getAllchannels').get(getSubscribedChannels)
router.route('/getAllsubscribers').get(getUserChannelSubscribers)

export default router;
