import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Content can not be empty");
  }
  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });
  if (!tweet) {
    throw new ApiError(400, "Tweet not uploaded");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created Successsfully"));
});
const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;
  if (!content) {
    throw new ApiError(400, "Content can not be empty");
  }
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "No tweet found");
  }
  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "You are not authorized to delete the tweet");
  }
  const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
    $set: {
      content,
    },
  });
  if (!updatedTweet) {
    throw new ApiError(400, "Tweet not updated");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated Successfully"));
});
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }
  const tweetToDelete = await Tweet.findById(tweetId);
  if (!tweetToDelete) {
    throw new ApiError(400, "Tweet not found");
  }
  if (tweetToDelete?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "you are not authorisez to delete this tweet");
  }
  await Tweet.findByIdAndDelete(tweetId);
  return res
    .statu(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});
const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }
  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "tweetOwner",
        pipeline: [
          {
            $project: {
              "avatar.url": 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likesCount",
        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likesCount",
        },
        ownerDetails: {
          $first: "$tweetOwner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user._id, "$likesCount.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        content: 1,
        ownerDetails: 1,
        likesCount: 1,
        createdAt: 1,
        isLiked: 1,
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, userTweets, "Tweets fetched Successfully"));
});
export { createTweet, updateTweet, deleteTweet, getUserTweets };
