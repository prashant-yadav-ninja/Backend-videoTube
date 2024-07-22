import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async function (req, res, next) {
  //   const accessToken = req.cookies.accessToken;
  // const refreshToken = req.cookies.refreshToken;

  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized To Access and Please Login ");
  }

  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  // console.log(decodedToken, " this is decoded token ");

  const user = await User.findById(decodedToken._id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(401, "Invalid Access Token");
  }

  // console.log(user,'coming from auth')

  req.user = user;
  next();
});
