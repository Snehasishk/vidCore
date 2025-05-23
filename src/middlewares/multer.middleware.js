import multer from "multer";
import fs from "fs";
//import path from "path";
//const tempFolderPath = path.resolve("public", "temp");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
