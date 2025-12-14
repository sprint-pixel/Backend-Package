import React from 'react'
import { v2 as cloudinary } from 'cloudinary';
import { User } from '../models/user.model';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const deleteOnCloudinary = async(localFilePath) => {
    try {
      const user= await User.
       const response = await cloudinary.uploader.destroy(

       )

    }
    catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
    }
}

export default deleteOnCloudinary
