import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(file, "inside destination");
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // console.log(file, "inside the filename");
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
