import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.info("[Cloudinary] Not configured — legacy Cloudinary videos cannot be deleted. New uploads use R2, so this is safe to ignore.");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lms-videos',
    resource_type: 'video', // necessary for video uploads
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv'],
  },
});

export const upload = multer({ storage: storage });
export { cloudinary };
