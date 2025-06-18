import multer from "multer";
import fs from "fs";

// Directories for uploads
const audioDir = "uploads/audio";
const imageDir = "uploads/images";
const documentDir = "uploads/documents"; // ✅ New directory

// Create directories if not present
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });
if (!fs.existsSync(documentDir)) fs.mkdirSync(documentDir, { recursive: true }); // ✅

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, audioDir);
    } else if (file.mimetype.startsWith("image/")) {
      cb(null, imageDir);
    } else if (
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" || // .doc
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
    ) {
      cb(null, documentDir);
    } else {
      cb(new Error("Unsupported file type"), null);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedAudio = ["audio/webm", "audio/mpeg", "audio/mp3", "audio/wav"];
  const allowedImage = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  const allowedDocs = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (
    allowedAudio.includes(file.mimetype) ||
    allowedImage.includes(file.mimetype) ||
    allowedDocs.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only audio, image, and document files are allowed"), false);
  }
};

// Multer middleware
export const uploadMedia = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
});
