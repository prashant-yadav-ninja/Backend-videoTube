import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/emailSend.js";
import { generateOTP, validOTP } from "../utils/otp.js";
import mongoose from "mongoose";

const generateAccessandRefreshToken = async function (userId) {
  try {
    const user = await User.findById(userId);

    const refreshToken = await user.generateRefreshToken();
    const accessToken = await user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save();

    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something Went Wrong While Generating Access and Refresh Token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get all the things like username , email etc from req
  // verify the items
  // check for the requrired files are coming
  // check already email, username not exist
  // files from server to cloudinary upload and check for its uploading
  // generate accessToken , refreshToken
  // create new user store in DB and return response

  // console.log(req)
  console.log(req.files);

  const { username, email, fullName, password } = req.body;

  // console.log('this is req.body ',req.body,' here it ends req.body')

  // console.log(email, password, fullName, username);

  // if ( username == "" || email == "" || fullName == "" || password == "" )
  // {
  //     throw new ApiError(400,"Username,Email,FullName,Password are required")
  // }

  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    // console.log(email, password, fullName, username);
    throw new ApiError(
      400,
      "UserName,Email,FullName,Password are required fields"
    );
  }

  // const existedUser = await User.findOne({
  //   $or:[{email},{username}]
  // })

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // const existedUser = await User.find()

  // console.log('this is existed User',existedUser)

  // if (existedUser){
  //   throw new ApiError(409,"User Already Exist")
  // }

  // console.log('helre')
  // console.log(req.files,'come from the register controller');

  const avatarLocalPath = req.files?.avatar?.[0].path;

  // console.log(avatarLocalPath,' this is avatar local path')

  // const avatarLocalPath = req.files?.avatar[0]?.path
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(409, "Avatar is Required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Something Went Wrong While Uploading Avatar");
  }

  // console.log(avatar)

  const createdUser = await User.create({
    email,
    username: username.toLowerCase(),
    password,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const userObj = createdUser.toObject();

  // delete createdUser.password
  // delete createdUser.refreshToken

  delete userObj.password;
  delete userObj.refreshToken;

  // const {password as newpassword ,refreshToken,...UserCreate} = createdUser

  // createdUser.select(
  //   "-password -refreshToken"
  // )

  // console.log(createdUser,' this is createdUser')
  // console.log(userObj,' this is userObj')

  // {
  //   avatar: [
  //     {
  //       fieldname: 'avatar',
  //       originalname: 'dragon-ball-z-son-goku-portrait-display-wallpaper-preview.jpg',
  //       encoding: '7bit',
  //       mimetype: 'image/jpeg',
  //       destination: './public/temp',
  //       filename: 'dragon-ball-z-son-goku-portrait-display-wallpaper-preview.jpg',
  //       path: 'public\\temp\\dragon-ball-z-son-goku-portrait-display-wallpaper-preview.jpg',
  //       size: 253609
  //     }
  //   ],
  //   coverImage: [
  //     {
  //       fieldname: 'coverImage',
  //       originalname: 'WIN_20221211_15_48_36_Pro.jpg',
  //       encoding: '7bit',
  //       mimetype: 'image/jpeg',
  //       destination: './public/temp',
  //       filename: 'WIN_20221211_15_48_36_Pro.jpg',
  //       path: 'public\\temp\\WIN_20221211_15_48_36_Pro.jpg',
  //       size: 133911
  //     }
  //   ]
  // }

  // validation for email pending

  return res
    .status(201)
    .json(new ApiResponse(200, userObj, "User Register Successfully"));

  // const response = new ApiResponse(200, { username, email }, "User registered successfully");

  // return res.status(response.statusCode).json(response);
  // return new ApiResponse(200, { username,email }, "User registered successfully");
  // throw new ApiResponse(200);
  // res.status(200).json({
  // message:"ok"
  // })

  //   console.log(req)
  //   console.log(req.file)
});

const loginUser = asyncHandler(async (req, res) => {
  // login using username/email , password take this from req.body
  // validate username,password
  // check for username present in DB
  // compare the password save and given password
  // access token and refresh token generate
  // send cookie

  const { username, password, email } = req.body;

  if (
    (username.trim() === "" && email.trim() === "") ||
    password.trim() === ""
  ) {
    throw new ApiError(400, "UserName/Email , Password are Required Fields");
  }

  // [username,password].map((field)=>field.trim())

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });

  if (!existedUser) {
    throw new ApiError(404, "User not Exist");
  }

  const isPasswordValid = await existedUser.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Please Enter Correct Password");
  }

  // console.log(existedUser, " before geneate ");

  // const refreshToken = await existedUser.generateRefreshToken()
  const { refreshToken, accessToken } = await generateAccessandRefreshToken(
    existedUser._id
  );

  const userObj = existedUser.toObject();

  // console.log(existedUser, " this is existed user from login controller");

  delete userObj.password;

  // delete userObj.refreshToken;  basically existed user which i get intially is without refresh token ( the object already comes)

  // console.log(req, " this is req object");

  // console.log(req.cookies, " this is req.cookie");

  // console.log(refreshToken, " this is refresh Token");
  // console.log(accessToken, " this is access Token");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, { httpOnly: true, secure: true })
    .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true })
    .json(
      new ApiResponse(
        200,
        { user: userObj, refreshToken, accessToken },
        "User Login Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: "",
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
    .json(new ApiResponse(200, {}, "User Logout Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // get the user for which refresh access token have to do
  // req.cookies.refreshToken and user.refreshToken compare this

  const incomingrefreshToken = req.cookies.refreshToken;

  if (!incomingrefreshToken) {
    throw new ApiError(400, "Please Login");
  }

  const decodedToken = jwt.verify(
    incomingrefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedToken._id);

  if (!user) {
    throw new ApiError(401, "Invalid Refresh Token");
  }

  if (incomingrefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Unauthorized Access");
  }

  const { refreshToken, accessToken } = await generateAccessandRefreshToken(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(200, {}, "Succesfully refresh Access and Refresh Token")
    );

  // const user = await User.findById(req.user._id)

  // if( user.refreshToken != incomingrefreshToken ){
  //   throw new ApiError(401,"Unauthorized Access")
  // }

  // const {refreshToken,accessToken} = await generateAccessandRefreshToken(user._id)

  // user.refreshToken = refreshToken
  // await user.save()

  // const options = {
  //   httpOnly: true,
  //   secure: true,
  // };

  // return res.status(201)
  // .cookie('accessToken',accessToken,options)
  // .cookie('refreshToken',refreshToken,options)
  // .json(new ApiResponse(200,"Refresh access and refresh Token"))
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if ([oldPassword, newPassword].some((field) => field.trim() === "")) {
    throw new ApiError(
      400,
      "UserName,OldPassword and NewPassword are required fields"
    );
  }

  const user = await User.findById(req.user._id);

  // first check for the username exist or not
  // const user = await User.findOne({username})

  // if(!user){
  //   throw new ApiError(401,'Invalid UserName/Password')
  // }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid Password");
  }

  user.password = newPassword;

  await user.save();

  return res
    .status(201)
    .json(new ApiResponse(200, {}, "Password Change Successfully"));

  // const user = await User.findById(req.user._id)
});

// if password forget route comes to action then it expect the username and send otp via email to it
const forgetPassword = asyncHandler(async (req, res) => {
  // get the username and validate
  // find the username
  // send the OTP in the email which is given by user ( valid for 2 min 😁)
  // validate the otp
  // enter new password

  const { username } = req.body;

  if (username.trim() === "") {
    throw new ApiError(400, "Username is Required");
  }

  const user = await User.findOne({ username });

  if (!user) {
    throw new ApiError(404, "Enter Valid Credential");
  }

  const otp = generateOTP();

  console.log("this is otp", otp);

  await sendEmail(user.email, otp);

  return res
    .status(200)
    .cookie("id", user._id)
    .json(new ApiResponse(200, {}, "OTP Sent"));
});

const validateOTP = (req, res) => {
  const { otp } = req.body;

  console.log(otp, "this is coming otp via req.body");

  const isValid = validOTP(otp);

  console.log(isValid);

  if (!isValid) {
    throw new ApiError(400, "Invalid or expires OTP");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "OTP verified, proceed with password reset")
    );
};

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (password.trim() === "") {
    throw new ApiError(400, "Please enter valid Password");
  }

  const id = req.cookies.id;

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "Something went wrong : Invalid Username");
  }

  user.password = password;

  await user.save();

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("id", options)
    .json(
      new ApiResponse(
        200,
        {},
        `${user.username} has successfully reset password`
      )
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // const user = await User.findById(req.user._id).select("-password -refreshToken")

  // console.log(user)

  return res.status(200).json(new ApiResponse(200, req.user, "Current User"));
});

const updateAvatarOrCoverImage = asyncHandler(async (req, res) => {
  // console.log(req.files, " from updateavatar / cover ");

  const avatarLocalPath = req.files?.avatar?.[0]?.path;

  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath && !coverImageLocalPath) {
    throw new ApiError(400, "Please give Avatar/CoverImage or Both");
  }
  // console.log(avatarLocalPath, coverImageLocalPath);

  let avatar, coverImage;

  let oldavatar = req.user?.avatar;
  let oldcoverImage = req.user?.coverImage;

  // console.log(oldavatar,oldcoverImage)

  if (avatarLocalPath) {
    avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
      throw new ApiError(500, "Something went wrong while uploading avatar");
    }
  }

  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage) {
      throw new ApiError(
        500,
        "Something went wrong while uploading coverImage"
      );
    }
  }

  if (oldavatar) {
    let publicidavatar = oldavatar.split("/");
    publicidavatar = publicidavatar[publicidavatar.length - 1].split(".")[0];
    await deleteFromCloudinary(publicidavatar);
  }

  if (oldcoverImage) {
    let publicidcoverImage = oldcoverImage.split("/");
    publicidcoverImage =
      publicidcoverImage[publicidcoverImage.length - 1].split(".")[0];
    await deleteFromCloudinary(publicidcoverImage);
  }

  //   // const avatar = await uploadOnCloudinary(avatarLocalPath);
  //   // const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // console.log(avatar,coverImage)

  const user = req.user;

  if (avatar) user.avatar = avatar.url;
  if (coverImage) user.coverImage = coverImage.url;

  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Avatar/CoverImage gets Updated Successfully")
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  console.log(username, "username from profile");

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username,
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
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
          $size: "$subscribers",
        },
        channelSubscibedCount: {
          $size: "$subscribedTo",
        },
        isSubscribedTo: {
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
        username: 1,
        fullName: 1,
        subscriberCount: 1,
        channelSubscibedCount: 1,
        isSubscribedTo: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  console.log(channel, "coming from getUserProfileChannel");

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

// get watch History again to do make it understandable and then better
const getWatchHistory = asyncHandler(async (req, res) => {
  // const user = User.aggregate([
  //   {
  //     $match: {
  //       _id: new mongoose.Types.ObjectId(req.user._id),
  //     },
  //   },
  //   // {
  //   //   $lookup: {
  //   //     from: "videos",
  //   //     localField: "watchHistory",
  //   //     foreignField: "_id",
  //   //     as: "History",
  //   //   },
  //   // },
  //   // {
  //   //   $project: {
  //   //     History: 1,
  //   //     username: 1,
  //   //   },
  //   // },
  // ]);

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  console.log(user, "this is from history");

  return res.status(200).json(new ApiResponse(200, user, "Watch History"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  forgetPassword,
  validateOTP,
  resetPassword,
  getCurrentUser,
  updateAvatarOrCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
