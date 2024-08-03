import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  if (!channelId) {
    throw new ApiError(400, "something went wrong while getting channelId");
  }

  console.log(channelId, ", from req.params");

  //   const checkSubscription = await Subscription.aggregate([
  //     {
  //       $match: {
  //         channel: new mongoose.Types.ObjectId(channelId),
  //         subscriber: req.user._id,
  //       },
  //     },
  //   ]);

  const checkSubscription = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user._id,
  });

  console.log(checkSubscription, " , coming from togSubs");

  let message;

  if (!checkSubscription) {
    await Subscription.create({
      channel: channelId,
      subscriber: req.user._id,
    });

    message = "channel have been subscribed";
  } else {
    await Subscription.findOneAndDelete({
      channel: channelId,
      subscriber: req.user._id,
    });

    message = "channel have been unsubscribed";
  }

  return res.status(200).json(new ApiResponse(200, {}, message));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  // user is login then they can see their subscriber list

  const subscriberList = await Subscription.aggregate([
    {
        $match:{
            channel:req.user._id
        }
    },
    {
        $lookup:{
            from:'users',
            localField:'subscriber',
            foreignField:'_id',
            as:'subscriberDetail'
        }
    },
    {
        $unwind:'$subscriberDetail'
    },
    {
        $project:{
            'username':'$subscriberDetail.username',
            'avatar':'$subscriberDetail.avatar'
        }
    }
  ])

  return res
    .status(200)
    .json(new ApiResponse(200, subscriberList, "subscribersTome"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {

  //   console.log(req.user._id)

  const channelList = await Subscription.aggregate([
    {
      $match: {
        subscriber: req.user._id,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetail",
      },
    },
    {
      $unwind: "$channelDetail",
    },
    {
      $project: {
        username: "$channelDetail.username",
        avatar: "$channelDetail.avatar",
      },
    },
  ]);

  console.log(channelList, ",subscribedChannels");

  return res.status(200).json(new ApiResponse(200, channelList, "subscribeByme"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
