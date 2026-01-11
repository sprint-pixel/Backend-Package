import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const subscriberId = req.user?._id

    if(!subscriberId){
        throw new apiError(400,"Please login to continue")
    }

    if(channelId.toString()===subscriberId.toString()){
        throw new apiError(400,"Can't self subscribe")
    }
    //check if existing subscriber
    const isSubscribed = await Subscription.findOne({
    $and: [
        { subscriber: new mongoose.Types.ObjectId(subscriberId) },
        { channel: new mongoose.Types.ObjectId(channelId) }
    ]
    })

    if(isSubscribed){
        await Subscription.findByIdAndDelete(
            isSubscribed?._id
        )
        return res.status(200)
        .json(new apiResponse(200,{subscribed:false},"Unsubscribed successfully")) 
    }

    if(!isSubscribed){  
        const newSubscription = await Subscription.create({
            subscriber: subscriberId,
            channel: channelId
        })

        if(!newSubscription){
            throw new apiError(500,"Failed to subscribe. Please try again")
        }

        return res.status(200)
        .json(new apiResponse(200,{subscribed:true },"Successfully Subscribed.")) 
    }    
    // TODO: toggle subscription
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    const {page = 1,limit =10} = req.querry;
    const subscriberList = Subscription.aggregate([
    {
        $match:{
            channel: new mongoose.Types.ObjectId(channelId)
        }
    },
    {
        $lookup:{
            from:"users",
            localField:"subscriber",
            foreignField:"_id",
            as:"userDetails",
            pipeline:[
                {
                    $project:{
                        username:1,
                        email:1,
                        avatar:1
                    }
                }
            ]
        }
    },
    {
        $unwind:"$userDetails"
    },
    {
        $sort:{
            createdAt:-1
        }
    }
    ])

    const option = {
        page: parseInt(page),
        limit : parseInt(limit),
    }

    const result = await Subscription.aggregatePaginate(subscriberList,option)

    return res.status(200).json(new apiResponse(200,result,"Successfully fetched subscriber lists."))
})