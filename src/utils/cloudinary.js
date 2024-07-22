import { v2 as cloudinary } from "cloudinary";
import fs, { fsyncSync } from "fs";
import { ApiError } from "../utils/ApiError.js";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async function (localFilePath) {
  try {
    if (!localFilePath) return null;

    // console.log(localFilePath , ' this is from cloudinary ');
    const response = await cloudinary.uploader.upload(localFilePath);
    // console.log(response);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async function (publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while deleting file from cloudinary"
    );
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
