import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    console.log("FILE NAME:", file.originalname);
    console.log("FILE MIME TYPE:", file.mimetype);

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    const extension = path.extname(file.originalname).toLowerCase();

    const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
    const isValidExtension = allowedExtensions.includes(extension);

    if (isValidMimeType || isValidExtension) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export default upload;
