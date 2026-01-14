import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const {content} = req.body

    if(!content || content.trim() === ""){
        throw new apiError(400,"Content is required")
    }

    const newTweet = await Tweet.create({
        owner: userId,
        content: content.trim()
    })

    if(!newTweet){
        throw new apiError(500,"Couldn't create tweet.")
    }

    const populatedDoc = await newTweet.populate("owner","avatar fullName username")

    return res.status(201).json(new apiResponse(201,populatedDoc,"Successfully created new tweet."))
    
    //TODO: create tweet
})

const getUserTweets = asyncHandler(async (req, res) => { //was confused on whether this controller function should fetch User's own tweets or someone else's tweet cause if it was my own tweet seeing functionality I could have got the _id of the user by `req.user` but since we have `userId` in the params we will have to fetch the _id using the req.params method.
    const {userId} = req.params;
    const {limit=10, page=1} = req.query;

    const fetchUserTweets= Tweet.aggregate([{
        $match:{
            owner:new mongoose.Types.ObjectId(userId)
        }
    },
    {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[{
                $project:{
                    avatar:1,
                    username:1,
                }
            }]
        }
    },
    {
        $addFields:{
            owner:{$first:"$owner"}
        }
    },
    {
        $sort:{
            createdAt:-1
        }
    }
])

const options = {
    limit: parseInt(limit),
    page: parseInt(page)
}

const paginatedUsertweets = await Tweet.ggregatePaginate(fetchUserTweets,options)

if(!paginatedUsertweets){
    throw new apiError(500,"Couldn't fetch tweets.Try again.")
}
return res.status(200).json(new apiResponse(200,paginatedUsertweets,"Successfully fetched user Tweets"))

    // TODO: get user tweets
})

return{ 
    createTweet, 
    getUserTweets}