import asyncHandler from "../utils/async-handler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/api-response.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  // validation
  //chech if user already exists
  //chech for image,avatar
  //upload them to cloudinary, avatar
  //create user object
  //remove password and refreshtoken from response
  //check for user ceration
  //return response

  const { fullname, username, email, password } = req.body;
  console.log("email is: ", email);
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log("avatarpath is: ", avatarLocalPath);
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log("coverImageLocalPath is: ", coverImageLocalPath);
  //here we check whether the user uploaded avatar file
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar filePath is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath).catch((error) =>
    console.log(error)
  );
  console.log("Avatar is:", avatar);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  //here we check whether the avatar file is uploaded on cloudinary
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  const user = await User.create({
    fullname,
    avatar: avatar.url || "",
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered Successfully"));
});

export { registerUser };
