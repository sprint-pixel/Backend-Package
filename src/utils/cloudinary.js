import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();


// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload function
const uploadOnCloudinary = async (localFilePath) => {
  try {
    console.log("🖼️ Local FIle path: ", localFilePath)
    if (!localFilePath) {
      console.error("Local file path not provided.");
      return null;
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log(`✅ File uploaded to cloudinary successfully: ${result.url}`);
    
    //delete local file after successful upload
    fs.unlinkSync(localFilePath);

    return result;
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error.message);

    // Remove local file if upload failed
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

export { uploadOnCloudinary };
