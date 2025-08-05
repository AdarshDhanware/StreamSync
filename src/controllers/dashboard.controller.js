import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id;

    if(!userId){
        throw new ApiError(404,"User not found")
    }

    const data = await Video.aggregate([
        {
            $match:{
                owner:userId
            }
        },
        {
            $group:{
                _id:"$owner",
                totalVideo:{$sum:1},
                totalViews:{$sum:"$views"},
                videoIds:{$push:"$_id"}
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"likes",
                let:{vids:"$videoIds"},
                pipeline:[
                    {
                        $match:{
                            $expr:{
                                $in:["$video","$$vids"]
                            }
                        }
                    }
                ],
                as:"Likes"
            }
        },
        {
            $addFields:{
                totalLikes : {$size:"$Likes"},
                totalSubscribers:{$size:"$subscribers"},
            }
        },
        {
            $project:{
                _id:0,
                totalVideo:1,
                totalViews:1,
                totalLikes:1,
                totalSubscribers:1
            }
        }
    ])

    if(!data){
        throw new ApiError(404,"No Data found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            data,
            "Data fetched successfully"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // Get all the videos uploaded by the channel
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const userId =req.user._id

    if(!userId){
        throw new ApiError(404,"User not found")
    }

    const aggregateQuery = Video.aggregate([
        {
            $match:{
                owner:userId
            }
        },
        {
            $sort:{createdAt:-1}
        }
    ])

    const options={
        page,
        limit
    }

    const videos = await Video.aggregatePaginate(aggregateQuery,options)

    if(!videos){
        throw new ApiError(404,"No video found")
    }


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "All video fetched successfully"
        )
    )

})

export {
    getChannelStats, 
    getChannelVideos
    }