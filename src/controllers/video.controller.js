import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { Video } from "../models/video.model.js";
import { populate } from "dotenv";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userID,
  } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  //Building the filter object to use later
  const filter = {};
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }
  if (userID && isValidObjectId(userID)) {
    filter.owner = userID;
  }
  //Building the sort object

  const sortOrder = sortType.toLowerCase() === "asc" ? 1 : -1;
  const sort = {};
  sort[sortBy] = sortOrder; //values of sort object set dynamically

  // .aggregate(): Starts a MongoDB aggregation pipeline for queries like filtering, sorting, grouping
  // .match(filter): Adds a $match stage to the aggregation to filter documents using the provided filter object
  // .sort(sort): Adds a $sort stage to the pipeline based on sortBy and sortOrder
  const videoAggregate = Video.aggregate().match(filter).sort(sort);
  const options = {
    page,
    limit,
    populate: { path: "owner", select: "username, email, avatar" },
    lean: true,
  };
  const result = await Video.aggregatePaginate(videoAggregate, options);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "All videos fetched succesfully"));
});
const getVideoById = asyncHandler(async (req, res) => {
  // 1.Input Validation
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  if (!isValidObjectId(req.user?._id)) {
    throw new ApiError(400, "Invalid userId");
  }
  // Aggregation pipelines begin here
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    }, // 2.Lookup likes
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscribers",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscriberCount: {
                $size: "subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: { $in: [req.user._id, "$subscribers.subcriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              "avatar.url": 1,
              subscriberCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        "videoFile.url": 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);
  if (!video) {
    throw new ApiError(400, "failed to fetch video");
  }
  // increment views
  video.views += 1;
  await video.save();
  //add to watchHistory
  await Video.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });
});
const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description is mandatory");
  }
  const thumbNailLocalPath = req.files?.thumbNail[0]?.path;
  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  if (!thumbNailLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  if (!videoFileLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const thumbNail = await uploadOnCloudinary(thumbNailLocalPath);
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  if (!videoFile) {
    throw new ApiError(400, "Video file not found");
  }
  if (!thumbNail) {
    throw new ApiError(400, "Thumbnail not found");
  }
  const video = await Video.create({
    title,
    description,
    thumbNail: thumbNail.url,
    video: videoFile.url,
    owner: req.user._id,
    duration: videoFile.duration,
  });
  const videoUploaded = await Video.findById(video._id);
  if (!videoUploaded) {
    throw new ApiError(400, "Video Upload Failed");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
});
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }
  // We will only let the owner update video
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }
  const { title, description } = req.body;
  //   if (title) video.title = title;
  //   if (description) video.description = description;
  //   await video.save();
  const thumbnailToDelete = video.thumbNail.public_id;

  const thumbNailLocalPath = req.file?.path;
  if (!thumbNailLocalPath) {
    throw new ApiError(400, "Thumbnail not found");
  }
  const thumbNail = await uploadOnCloudinary(thumbNailLocalPath);
  if (!thumbNail) {
    throw new ApiError(400, "Thumbnail not found");
  }
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbNail: {
          public_id: thumbNail.public_id,
          url: thumbNail.url,
        },
      },
    },
    {
      new: true,
    }
  );
  if (!updatedVideo) {
    throw new ApiError(400, "File to upload video plese try again");
  }
  if (updatedVideo) {
    await deleteOnCloudinary(thumbnailToDelete);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "No video found");
  }
  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You do not have the permission to delete the video"
    );
  }
  await deleteOnCloudinary(video.thumbNail.public_id);
  await deleteOnCloudinary(video.videoFile.public_id, "video");
  const deletedVideo = await Video.findByIdAndDelete(videoId);
  if (!deletedVideo) {
    throw new ApiError(400, "Failed to delete the video please try again");
  }
  // delete video likes
  await Like.deleteMany({ video: videoId });

  // delete video comments
  await Comment.deleteMany({ video: videoId });
});
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't toogle publish status as you are not the owner"
    );
  }
  const toggledVideoPublish = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video?.isPublished,
      },
    },
    {
      new: true,
    }
  );
  if (!toggledVideoPublish) {
    throw new ApiError(500, "Failed to toogle video publish status");
  }
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isPublished: toggledVideoPublish.isPublished,
      },
      "Video publish toggled successfully"
    )
  );
});

export {
  getAllVideos,
  getVideoById,
  publishVideo,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
