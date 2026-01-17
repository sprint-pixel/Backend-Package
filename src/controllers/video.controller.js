import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const pipeline = [];
    const defaultCriteria = {
        isPublished:true
    }

    //if user searches something
    if (query) {
        defaultCriteria.$or = [
            { title: { $regex: query, $options: "i" } },//$regex-> You search "coding"(query) application fetches videos with title: "code with me ", "best coding langauge"-> title don't exactly have to match. And $options: "i" makes the search case insensitive. Fetches video with title: "CODING", "Coding","cOdinG" 
            { description: { $regex: query, $options: "i" } }
        ]
    }

    //Assignment: let user see their own draft videos(rn they can't even see their own draft videos if they haven't published it.)
    
    //if user visits a specific profile:
    if(userId){
        if(!mongoose.isValidObjectId(userId)){
            throw new apiError(400,"Invalid User 1")
        }
        defaultCriteria.owner = new mongoose.Types.ObjectId(userId)
    }

    //push the completed criteria as the first stage 
    pipeline.push({
        $match: defaultCriteria
    })
   

    //if user sorts by some type of filter:(most expensive,least expensive,most liked...)
    const sortField = {}
    if(sortBy){
         sortField[sortBy]= sortType === "asc" ? 1 : -1         
    }
    else{
        sortField["createdAt"] = sortType === "asc" ? 1: -1
    }

    pipeline.push({
        $sort: sortField
    })

    pipeline.push(
        {

            $lookup:{
                from:"users",
                localField: "owner",
                foreignField: "_id",
                as:"owner",
                pipeline:[{
                    $project:{
                        avatar:1,
                        username:1
                    }
                }]
            },
      },
      {
        $addFields:{
                owner:{$first:"$owner"}
            }
      }
)

    const options= {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const paginatedVideos = await Video.aggregatePaginate(Video.aggregate(pipeline),options)

    if(!paginatedVideos){
        throw new apiResponse(500,"Couldn't fetch videos, Please try again.")
    }
    
    return res.status(200).json(new apiResponse(200,paginatedVideos,"Successfully fetched videos"))
    //TODO: get all videos based on query, sort, pagination
})
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    //algorithm: 1. check if user is logged in or not (if !req.user?._id)
    //2. check if the title & description came in.
    //3. if the required feilds come in then publish the video and multer checks if it exceeds certain file size (currently 20 GB)
    //4. provide the filepaths to the cloudinary
    //5. use the file path variable in the helper function `uploadOnCloudinary()` to upload the video.
    //6. create new document of the video in db with storing url of video on the db.
    //7. if the upload to db failed then run deleteFromCloudinary helper fucntion to prevent the ghost file issue.
    
    if(!req.user?._id){
        throw new apiError(400,"Please login and try again")
    }

    if( [title,description].some((field)=>field.trim()=== "")){
        throw new apiError(400,"All feilds are required.")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailFileLocalPath = req.files?.thumbnail?.[0]?.path

    if(!videoFileLocalPath){
        throw new apiError(400,"Video File is required.")
    }

    if(!thumbnailFileLocalPath){
        throw new apiError(400,"Thumbnail is required.")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnailFile = await uploadOnCloudinary(thumbnailFileLocalPath)

    if(!videoFile?.url || !thumbnailFile?.url){
        throw new apiError(500,"Upload to cloudinary failed. Please try again")
    }


    //implemented try catch to preven ghost file issue->(Don't have access to the file(.create() failed) so can't remove it, taking exrta space in our cloud costing us 💸)
    try{
        const uploadVideo= await Video.create({
        videoFile: {
            url:videoFile.url,
            public_id:videoFile.public_id
        },
        thumbnail:{
            url:thumbnailFile.url,
            public_id:thumbnailFile.public_id
        },
        owner: req.user?._id,
        title: title.trim(),
        description: description.trim(),
        duration: videoFile.duration,
        views: 0,
        isPublished:true
    })
    //aint using (!uploadVideo) cause code wouldn't even reach it if the .create() failed, it would go straight to the asynchandler

    return res.status(201).json(new apiResponse(201,uploadVideo,"Successfully uploaded video"))

    }
    catch(error){
        if(videoFile?.public_id){   //checks if the url is in the cloudinary in the first place,
            await deleteFromCloudinary(videoFile.public_id,"video")
        }
        if (thumbnailFile?.public_id){ 
            await deleteFromCloudinary(thumbnailFile.public_id,"image")
        }
    throw error;
}
    // TODO: get video, upload to cloudinary, create video
})

export{ getAllVideos,publishAVideo}