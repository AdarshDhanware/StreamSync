import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    // get all videos based on query, sort, pagination
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid request");
    }

    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized access");
    }

    if (user._id.toString() !== userId) {
        throw new ApiError(401, "Bad request");
    }

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;

    const sort = {};
    if (sortBy) {
        sort[sortBy] = sortType === "asc" ? 1 : -1;
    }

    const videoQuery = Video.aggregate([
        {
            $match: {
                isPublished: true,
                ...(query && {
                    $or: [
                        { title: { $regex: query, $options: "i" } },
                        { description: { $regex: query, $options: "i" } },
                    ],
                }),
            },
        },
        {
            $sort: sortBy ? sort : { createdAt: -1 },
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
            $unwind: "$owner",
        },
        {
            $project: {
                video: 1,
                description: 1,
                duration: 1,
                title: 1,
                views: 1,
                thumbnail: 1,
                "owner.fullName": 1,
                "owner.avatar": 1,
            },
        },
    ]);

    const result = await Video.aggregatePaginate(videoQuery, {
        page: pageNumber,
        limit: limitNumber,
    });

    if (!result || result.docs.length === 0) {
        throw new ApiError(404, "No videos found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Video fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    // get video, upload to cloudinary, create video
    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized access");
    }

    if (!title.trim() === "" || !description.trim() === "") {
        throw new ApiError(400, "Title and description cannot be empty");
    }

    const files = req.files;
    if (!files?.videoFile || !files?.thumbnail) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const videoLocalPath = files?.videoFile[0]?.path;
    const thumbnailLocalPath = files?.thumbnail[0]?.path;
    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video file and thumbnail is required");
    }

    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!video || !thumbnail) {
        throw new ApiError(500, "An error occured");
    }

    const videoDoc = await Video.create({
        videoFile: video?.url,
        thumbnail: thumbnail?.url,
        title,
        description,
        owner: user?._id,
        duration: video?.duration,
    });

    const vid = await Video.findById(videoDoc._id);

    if (!vid) {
        throw new ApiError(500, "Internal server error");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videoDoc, "Video is uploaded"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid request");
    }

    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized access");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // update video details like title, description, thumbnail
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid request");
    }

    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized access");
    }

    const { title, description } = req.body;
    if (!title.trim() || !description.trim()) {
        throw new ApiError(400, "Title and description cannot be empty");
    }

    let thumbnailLocalPath;
    let thumbnail;

    if (
        req.file &&
        typeof req.file.path === "string" &&
        req.file.path.trim() !== ""
    ) {
        thumbnailLocalPath = req.file.path;

        const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
        if (!thumbnailUpload) {
            throw new ApiError(500, "Thumbnail upload failed");
        }
        thumbnail=thumbnailUpload
    }

    const updatedVideo = await Video.findOneAndUpdate(
        { _id: videoId, owner: user._id },
        {
            title,
            description,
            thumbnail: thumbnail.url,
        },
        {
            new: true,
        }
    );

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found or not authorized");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Video details updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // delete video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid request");
    }

    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized access");
    }

    const deletedVideo = await Video.findOneAndDelete({
        _id: videoId,
        owner: user._id,
    });
    if (!deletedVideo) {
        throw new ApiError(404, "Video not found or not authorized to delete");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid request");
    }

    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized access");
    }

    const video = await Video.findOne({
        _id: videoId,
        owner: user._id,
    });
    if (!video) {
        throw new ApiError(404, "Video not found or not authorized");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Publish status updated"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
