import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";
import { Subscription } from "../models/subscription.model.js";
import { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }
  const isSubscribed = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user._id,
  });
  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed._id);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { subscribed: false }, "Unsubscribed Successfully")
      );
  }
  await Subscription.create({
    subscriber: req.user?._id,
    channel: channelId,
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, { subscribed: true }, "subscribed successfully")
    );
});
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelID } = req.params;
  if (!isValidObjectId(channelID)) {
    throw new ApiError(400, "UserID is not valid");
  }
  const subscriberList = await Subscription.find({
    channel: channelID,
  }).populate("subscriber", "fullname,username,avatar");
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriberList,
        "Subscribers list fetched successfully"
      )
    );
});
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberID } = req.params;
  if (!isValidObjectId(subscriberID)) {
    throw new ApiError(400, "UserID is not valid");
  }
  const subscribedTo = await Subscription.find({
    subscriber: subscriberID,
  }).populate("channel", "username fullname avatar");
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedTo,
        "Subscribed channel fetched successfully"
      )
    );
});

export { toggleSubscription, getSubscribedChannels, getUserChannelSubscribers };
