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

export{ getAllVideos}