// import {v2 as cloudinary} from cloudinary
// import fs from "fs" 

//     // Configuration
//     cloudinary.config({ 
//         cloud_name: process.env.COLOUDINARY_CLOUD_NAME, 
//         api_key: process.env.COLOUDINARY_API_KEY, 
//         api_secret: process.env.COLOUDINARY_API_SECRET 
//     });

//     //Upload an image

//     const uploadOnCloudinary = async (localFilePath) =>{
//         try{
//             if(!localFilePath) return console.error("couldn't find local path");
//                 //upload the file on cloudinary
//             const response=await cloudinary.uploader.upload(localFilePath,{
//                 resource_type:"auto"
//             })
//             console.log(`File Has been uploaded on cloudinary. ${response.url}`)
//             return response // 
 
//         }
//         catch(error){
//             fs.unlinkSync(localFilePath) //remove the lcally saved temporary file as the upload operation got failed.
//             return null;

//         }
//     }

//     export{uploadOnCloudinary} ;
    
//     console.log(uploadResult);


import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

//configuring
cloudinary.config({
    cloud_name:process.env.COLOUDINARY_CLOUD_NAME,
    api_key:process.env.COLOUDINARY_API_KEY,
    api_secret:process.env.COLOUDINARY_API_SECRET,
})

//uploading 
const uplooadOnCloudinary= async function(localFilePath){
    try{ if(!localFilePath) return null;
        
        const result=await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"
    })

    //file successfully uploaded 
    console.log(`File has been successfully uploaded!. ${result.url}`)

    return result;
}
catch(error){
    fs.unlinkSync(localFilePath) //removes the temporily saved file as the upload operation gets failed.
    return null;
}
}

export {uplooadOnCloudinary}

