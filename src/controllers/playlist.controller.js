import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {description} = req.body
    let {name} = req.body //let cause we are changing value of name⇂⇂⇂

    if(!name || name.trim()=== ""){
         name=`New Playlist ${new Date().toLocaleDateString()}`
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
            $match:{  //find the playlist document owned by the user
                    owner: new mongoose.Types.ObjectId(userId), //ain't using {$exists:true} on videos as we need to return playlists with empty videos array as well
            }
        },
        {
            $sort:{
                createdAt: -1 //most recent first
            }
        },
        {
            $addFields:{
                totalVideos: {$size: "$videos"}
            }
        }
    ])

    return res
    .status(200)
    .json(new apiResponse(200, playlists? playlists : [], "User playlists fetched successfully"))
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!mongoose.isValidObjectId(playlistId)){
        throw new apiError(400,"Invalid Playlist Id")
    }

    const playlist = await Playlist.aggregate([
       {
         $match:{
            _id: new mongoose.Types.ObjectId(playlistId) 
        }
       },
       {
        $lookup:{
            from: "videos", //Playlist->Video
            localField: "videos", //currently in Video
            foreignField: "_id",
            as: "videos",
            pipeline: [
                {
                    $lookup:{
                        from: "users",  //Video->User
                        localField: "owner", //currently in User
                        foreignField: "_id",
                        as: "ownerDetails",
                        pipeline: [
                            {
                                $project:{
                                    username:1,
                                    avatar:1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields:{
                        ownerDetails:{ $first:"$ownerDetails"}
                    }
                }
            ]
        }
       },
    ])


    if(playlist.length === 0){
        throw new apiError(404,"Playlist doesn't exist.")
    }

    return res
    .status(200)
    .json(new apiResponse(200, playlist[0], "Fetched Playslist Succesfully."))

})


export {
    createPlaylist,
    getUserPlaylists,
}
