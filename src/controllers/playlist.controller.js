import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || name.trim()=== ""){
        throw new apiError(400, "Playlist Title is required ")
    }

    //the Video will be later added to the playlist
    const createPlaylist = await Playlist.create({
        name: name.trim(),
        description: description ? description.trim() : "",
        videos: [],
        owner: req.user?._id
    })

    if(!createPlaylist){
        throw new apiError(500, "Failed to create playlist")
    }

    return res
    .status(201)
    .json(new apiResponse(201, createPlaylist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new apiError(400, "Invalid user id")
    }
    
    const playlists = await Playlist.aggregate([
        {
            $match:{
                    owner: new mongoose.Types.ObjectId(userId), //ain't using {$exists:true} on videos as we need to return playlists with empty videos array as well
            }
        },
    ])

    //if we don't find any playlists, we won't want to throw an error, just return an empty array
    return res
    .status(200)
    .json(new apiResponse(200, playlists? playlists : [], "User playlists fetched successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
}
