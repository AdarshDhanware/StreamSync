import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid request");
    }

    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized access");
    }

    const isAlreadyLiked = await Like.findOne({
        likedBy: userId,
        video: videoId,
    });

    if (isAlreadyLiked) {
        const dislike = await Like.findOneAndDelete(
            {
                likedBy: userId,
                video: videoId,
            },
            {
                new: true,
            }
        );

        if (!dislike) {
            throw new ApiError(500, "Failed to remove like");
        }

        return res
            .status(200)
            .json(new ApiResponse(200,null, "Video disliked successfully"));
    }

    const likeVideo = await Like.create({
        likedBy: userId,
        video: videoId,
    });

    if(!likeVideo){
        throw new ApiError(500,"Failed to like")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, likeVideo, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    // toggle like on comment
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid request")
    }

    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized access");
    }

    const isCommentAlreadyLiked = await Like.findOne({
        likedBy:userId,
        comment:commentId
    })

    if(isCommentAlreadyLiked){
        const dislikeComment = await Like.findOneAndDelete(
            {
                likedBy:userId,
                comment:commentId
            }
        )
        if(!dislikeComment){
            throw new ApiError(400,"Failed to dislike comment")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Comment disliked successfully"
            )
        )
    }

    const commentLike = await Like.create({
        likedBy: userId,
        comment: commentId,
    });
    if (!commentLike) {
        throw new ApiError(500, "Failed to like comment");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, commentLike, "Comment liked successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    // toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid request")
    }

    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized access");
    }

    const isAlreadyLikedTweet = await Like.findOne({
        likedBy:userId,
        tweet:tweetId
    })

    if(isAlreadyLikedTweet){
        const dislikeTweet = await Like.findOneAndDelete({
            likedBy:userId,
            tweet:tweetId
        })
        if(!dislikeTweet){
            throw new ApiError(400,"Failed to dislike tweet")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Tweet disliked successfully"
            )
        )
    }

    const tweetLike = await Like.create({
        likedBy: userId,
        tweet: tweetId,
    });

    if (!tweetLike) {
        throw new ApiError(500, "Failed to like tweet");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweetLike, "Tweet liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    // get all liked videos
    const { page = 1, limit = 10 } = req.query;

    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized access");
    }

    const likedDoc = await Like.find({
        likedBy: userId,
        video: { $ne: null },
    });

    const likedIds = likedDoc.map((doc) => doc.video);

    console.log(likedIds);

    if (!likedDoc.length) {
        throw new ApiError(404, "No liked videos found");
    }

    const videoQuery = Video.aggregate([
        {
            $match: {
                _id: { $in: likedIds },
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
    ]);

    const videos = await Video.aggregatePaginate(
        videoQuery,
        {
            page:parseInt(page),
            limit:parseInt(limit)
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, videos, "Liked videos fetched successfully")
        );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
