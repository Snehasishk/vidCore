import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    //UPLOAD FILE ON CLOUDINARY
    const respone = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //FILE HAS BEEN UPLOADED SUCCESSFULLY
    console.log("File has been uploaded on cloudinary", respone.url);
    return respone;
  } catch (error) {
    //REMOVE THE LOCALLY SAVED TEMPORARY FILE AS THE UPLOAD OPERATION GOT FAILED
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { uploadOnCloudinary };

// import { v2 as cloudinary } from "cloudinary";

// (async function () {
//   // Configuration
//   cloudinary.config({
//     cloud_name: "dbibkkhht",
//     api_key: "852579668658754",
//     api_secret: "LKRFE4eEBtoIE9gVVR-ApSPOccc", // Click 'View API Keys' above to copy your API secret
//   });

//   // Upload an image
//   const uploadResult = await cloudinary.uploader
//     .upload(
//       "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
//       {
//         public_id: "shoes",
//       }
//     )
//     .catch((error) => {
//       console.log(error);
//     });

//   console.log(uploadResult);

//   // Optimize delivery by resizing and applying auto-format and auto-quality
//   const optimizeUrl = cloudinary.url("shoes", {
//     fetch_format: "auto",
//     quality: "auto",
//   });

//   console.log(optimizeUrl);

//   // Transform the image: auto-crop to square aspect_ratio
//   const autoCropUrl = cloudinary.url("shoes", {
//     crop: "auto",
//     gravity: "auto",
//     width: 500,
//     height: 500,
//   });

//   console.log(autoCropUrl);
// })();
