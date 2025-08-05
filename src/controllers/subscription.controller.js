import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    // toggle subscription
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid request")
    }

    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized accesss");
    }

    // if already subscribed then unsubscribe it
    const alreadySubscribe = await Subscription.findOne({
        subscriber: user._id,
        channel: channelId,
    });

    if (alreadySubscribe) {
        await Subscription.findOneAndDelete({
            subscriber: user._id,
            channel: channelId,
        });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    null,
                    "Channel unsubscribed successfully"
                )
            );
    }

    const subscribe = await Subscription.create({
        subscriber: user._id,
        channel: channelId,
    });

    const done = await Subscription.findById(subscribe._id)
    if(!done){
        throw new ApiError(409,"An error occured")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscribe,
            "Channel subscribed successfully"
        )
    )
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"Invalid request")
    }

    const user = req.user;
    if(!user){
        throw new ApiError(401,"Unauthorized access")
    }

    
    const SubscriberList = await Subscription.aggregate(
        [
            {
                $match:{channel:new mongoose.Types.ObjectId(subscriberId)}
            },
            {
                $lookup:{
                    from:"users",
                    localField:"subscriber",
                    foreignField:"_id",
                    as:"subscriberInfo"
                }
            },
            {
                $unwind:"$subscriberInfo"
            },
            {
                $project:{
                    username:"$subscriberInfo.username",
                    fullName:"$subscriberInfo.fullName",
                    avatar:"$subscriberInfo.avatar"
                }
            }
        ]
    )

    if(!SubscriberList){
        throw new ApiError(409,"An error occured")
    }

    if(!SubscriberList.length){
        throw new ApiError(400,"No subscriber")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            SubscriberList,
            "Subscriber list fetched successfully"
        )
    )

});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid request")
    }

    const user=req.user;
    if(!user){
        throw new ApiError(401,"Unauthorized access")
    }

    const channelList = await Subscription.aggregate(
        [
            {
                $match:{
                    subscriber:new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"channel",
                    foreignField:"_id",
                    as:"channelInfo"
                }
            },
            {
                $unwind:"$channelInfo"
            },
            {
                $project:{
                    username:"$channelInfo.username",
                    fullName:"$channelInfo.fullName",
                    avatar:"$channelInfo.avatar"
                }
            }
        ]
    )
    
    if(!channelList){
        throw new ApiError(409,"An error occured")
    }

    if(!channelList.length){
        throw new ApiError(400,"No channel subscribed")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channelList,
            "Channels list fetched"
        )
    )
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
