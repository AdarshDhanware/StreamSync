import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import { validateHeaderName } from "http";
import { subscribe } from "diagnostics_channel";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { refreshToken, accessToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists - username or email
    // check for images,check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from respone
    // check for user creation
    // return res

    const { fullName, email, username, password } = req.body;
    // console.log("email: ", email);

    if (
        [fullName, email, password, username].some(
            (field) => field?.trim === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    // console.log(req)

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    if (existedUser) {
        if (avatarLocalPath && fs.existsSync(avatarLocalPath)) {
            fs.unlinkSync(avatarLocalPath);
        }

        if (coverImageLocalPath && fs.existsSync(coverImageLocalPath)) {
            fs.unlinkSync(coverImageLocalPath);
        }

        throw new ApiError(
            409,
            "User with this email or username is already exists"
        );
    }

    // upload on coudinary takes time to upload a file and file may be large
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    // removal of password and refreshToken
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered successfully")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    // get data and check for the empty field
    // check if user is new then it require to register then login
    // if user exits with that email or username then check password correct or not
    // if password is correct then give access token and refresh token to the user and send cookies to the user and logged in the user

    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const { email, username, password } = req.body;

    // if require both
    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    // for any one for the process
    // if(!(username || email)){
    //     throw new ApiError(400,"Username or email is required")
    // }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "User does not exists");
    }

    const isPasswordvalid = await user.isPasswordCorrect(password);

    if (!isPasswordvalid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // options are used for to edit the cookies only from the serve side , they only readable on frontend but not editable
    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged In successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // checking the token is same or not (incoming token and saved token)
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, newRefreshToken } =
            await generateAccessAndRefreshTokens(user?._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken,
                    },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const userId = req.user?._id; // by auth middleware

    if (!userId) {
        throw new ApiError(400, "Unauthorized request");
    }

    const { password, newPassword } = req.body;

    if (
        !password ||
        !newPassword ||
        password.trim() === "" ||
        newPassword.trim() === ""
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findById(userId._id);

    if (!user) {
        throw new ApiError(400, "Unauthorized request");
    }

    const isCorrectPassword = await user.isPasswordCorrect(password);

    if (!isCorrectPassword) {
        throw new ApiError(400, "Invalid credentials");
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    const newPassCheck = await user.isPasswordCorrect(newPassword);

    if (!newPassCheck) {
        throw new ApiError(500, "Password change failed");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched successfully")
        );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }

    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(400, "Unauthorized access");
    }

    // when we use "findByIdAndUpdate" don't need to run save
    const updated = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                fullName,
                email,
            },
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");

    if (!updated) {
        throw new ApiError(409, "Details update failed");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Details update successfully"));
});

const UpdateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatar.url },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "New avatar uploaded successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image is required");
    }

    const uploadedCoverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!uploadedCoverImage) {
        throw new ApiError(400, "Cover image updating failed");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { coverImage: uploadedCoverImage.url },
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(500, "Internal server error");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username) {
        throw new ApiError(400, "Username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                // Select only those documents that match the condition
                username: username.toLowerCase(),
            },
        },
        {
            $lookup: {  // Join with another collection (like SQL join)
                from: "subscriptions", // Name of the collection to join with
                localField: "_id", // Field from the current collection (usually a reference field)
                foreignField: "channel", // Field in the 'from' collection to match against
                as: "subscribers", // Name of the new array field to store joined documents
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscriberCount: {
                    $size:"$subscribers",
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscriberCount: 1,
                isSubscribed: 1,
                channelSubscribedToCount: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            },
        },
    ]);

    // console.log(channel);

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exists");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "User Channel fetched successfully"
            )
        );
});


const getWatchHistory = asyncHandler(async (req,res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    // make things easy by this on frontend user can get data easily 
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    UpdateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory,
};
