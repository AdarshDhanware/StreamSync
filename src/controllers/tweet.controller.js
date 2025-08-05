import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    // create tweet
    const { content } = req.body;
    if (!content || !content.trim()) {
        throw new ApiError(400, "Tweet content is required.");
    }

    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized access");
    }

    const newTweet = await Tweet.create({
        owner: user._id,
        content: content,
    });

    const check = await Tweet.findById(newTweet._id);
    if (!check) {
        throw new ApiError(500, "Failed to verify tweet creation");
    }

    return res.status(200).json(new ApiResponse(200, newTweet, "Tweet done"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    // get user tweets
    const { userId } = req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid request")
    }

    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized access");
    }

    const userTweet = await Tweet.find({ owner: userId });

    if (!userTweet) {
        throw new ApiError(500, "Error fetching tweets");
    }

    if (userTweet.length===0) {
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                [],
                "No tweets found"
            )
        )
    }

    return res
        .status(200)
        .json(new ApiResponse(200, userTweet, "Tweet fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    // update tweet
    const { tweetId } = req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid request")
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
        throw new ApiError(400, "Tweet content is required");
    }

    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized access");
    }

    const updatedTweet = await Tweet.findOneAndUpdate(
        { _id: tweetId, owner: user._id },
        {
            content,
        },
        {
            new: true,
        }
    );

    if (!updatedTweet) {
        throw new ApiError(500, "Tweet update failed");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "Tweet update sucessfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    // delete tweet
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid request");
    }

    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized access");
    }

    const deletedTweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: user._id,
    });
    if (!deletedTweet) {
        throw new ApiError(500, "Tweet delete failed");
    }

    return res
        .status(200)
        .json(new ApiResponse(200,null, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
