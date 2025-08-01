// config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

export const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "empathai",
    allowed_formats: ["jpg","png","gif","mp4","mp3","wav","webm"],
    resource_type: (req, file) => {
      if (file.mimetype.startsWith("image/")) return "image";
      if (file.mimetype.startsWith("video/")) return "video";
      if (file.mimetype.startsWith("audio/")) return "video"; // Cloudinary maps audio → video
      return "auto";
    },
  },
});

// Export a multer instance configured to use CloudinaryStorage
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max per file
});
