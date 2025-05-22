import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
export const fileUpload = upload.fields([
  {
    name: "avatar",
    maxCount: 1,
  },
  {
    name: "coverImage",
    maxCount: 1,
  },
]);
