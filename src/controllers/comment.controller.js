import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //get all comments for a video
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid request");
    }

    const { page = 1, limit = 10 } = req.query;

    const videoComment = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
    ]);

    const comment = await Comment.aggregatePaginate(videoComment, {
        page,
        limit,
    });

    if (comment.docs.length==0) {
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                [],
                "No comments found"
            )
        )
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    // add a comment to a video
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access");
    }

    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid request");
    }

    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    const { content } = req.body;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Empty field");
    }

    const comment = await Comment.create({
        content: content,
        video: videoId,
        owner: userId,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    // update a comment
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized access");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Empty fields");
    }

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid request");
    }

    const updatedComment = await Comment.findOneAndUpdate(
        {
            _id: commentId,
            owner: userId,
        },
        {
            content,
        },
        {
            new: true,
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment updated successfully")
        );
});

const deleteComment = asyncHandler(async (req, res) => {
    // delete a comment
    const { commentId } = req.params;
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized access");
    }

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid request");
    }

    await Comment.findOneAndDelete({
        _id: commentId,
        owner: userId,
    });

    const check = await Comment.findById(commentId);

    if (check) {
        throw new ApiError(409, "Comment not deleted");
    }

    return res
        .status(200)
        .json(new ApiResponse(200,null, "Comment deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
