import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directory exists
const audioDir = "uploads/audio";
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

// Storage config
const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, audioDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  },
});

// File filter for audio
const audioFilter = function (req, file, cb) {
  const allowedTypes = ["audio/webm", "audio/mpeg", "audio/mp3", "audio/wav"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid audio type. Only mp3, wav, webm allowed."));
  }
};

export const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});
