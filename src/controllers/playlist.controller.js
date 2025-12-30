import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //algorithm:
    //1. take input (name,description) from req.body
    //2. take _id from req.user 
    //3. In the videos array, I am confused as there can be 2 ways, either create a playlist and add video later OR only allow user to create a playlist once he has selected the video the include as the first video.let's name 1st one A and 2nd one B
    //3.A. since we have all the required feilds and sincce video will be uploaded later in the array we will keep it empty for now and add video later on to the array, and that would sum up our controller. 
    //3.B. TWO cases: 1. The user will be playing the video itself to add it to the playlist-> grab the _id of the video from the params,  2. We can also grab the video from the preview mode and make it our first video->  BUT the given input here dosen't allow us to take the _id of the video by the frontend. So We will go with 3.A option
    //4. Check if the process failed to happen, if it did return 500 error, if not return succesful apiResponse with data-> newplaylist

    //TODO: create playlist
})


export {
    createPlaylist,
}
