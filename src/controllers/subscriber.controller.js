import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";
import { Subscription } from "../models/subscription.model.js";
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
const getUserChannelSubscribers = asyncHandler(async (req, res) => {});
const getSubscribedChannels = asyncHandler(async (req, res) => {});

export { toggleSubscription, getSubscribedChannels, getUserChannelSubscribers };
