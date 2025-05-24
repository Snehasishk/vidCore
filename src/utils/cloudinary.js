import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("Cloudinary configured:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "SET" : "MISSING",
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //UPLOAD FILE ON CLOUDINARY
    const respone = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //FILE HAS BEEN UPLOADED SUCCESSFULLY
    // console.log("File has been uploaded on cloudinary", respone.url);
    fs.unlinkSync(localFilePath);
    return respone;
  } catch (error) {
    //REMOVE THE LOCALLY SAVED TEMPORARY FILE AS THE UPLOAD OPERATION GOT FAILED
    fs.unlinkSync(localFilePath);
    return error;
  }
};

export { uploadOnCloudinary };
