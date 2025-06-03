import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }
  const commentAggregate = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user._id, "4likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        likesCount: 1,
        isLiked: 1,
        content: 1,
        createdAt: 1,
        owner: {
          fullname: 1,
          username: 1,
          "avatar.url": 1,
        },
      },
    },
  ]);
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };
  const comments = await Comment.aggregatePaginate(commentAggregate, options);
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "All comments fetched"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  const newComment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });
  if (!newComment) {
    throw new ApiError(500, "Failed to add comment please try again");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Added new comment"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { commentId } = req.params;
  if (!content) {
    throw new ApiError(400, "content is required");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const comment = await Comment.findById(commentId);
  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "You are not authorized to update comment");
  }
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content },
    },
    {
      new: true,
    }
  );
  if (!updatedComment) {
    throw new ApiError(500, "Failed to update comment, Please try again");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment Updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { commentId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const comment = await Comment.findById(commentId);
  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "You are not authorized to delete comment");
  }
  await Comment.findByIdAndDelete(req.user?._id);
  await Like.deleteMany({
    comment: commentId,
  });
  return res.status(200).json(new ApiResponse(200, {}, "Commment deleted"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
