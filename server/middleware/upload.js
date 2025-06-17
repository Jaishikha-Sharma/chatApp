import multer from "multer";
import fs from "fs";

// Directories for uploads
const audioDir = "uploads/audio";
const imageDir = "uploads/images";

// Create directories if not present
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, audioDir);
    } else if (file.mimetype.startsWith("image/")) {
      cb(null, imageDir);
    } else {
      cb(new Error("Unsupported file type"), null);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedAudio = ["audio/webm", "audio/mpeg", "audio/mp3", "audio/wav"];
  const allowedImage = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  if (allowedAudio.includes(file.mimetype) || allowedImage.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only audio and image files are allowed"), false);
  }
};

// Multer middleware
export const uploadMedia = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
});
