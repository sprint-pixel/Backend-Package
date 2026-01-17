import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema= mongoose.Schema({
    videoFile:{  //couldinary url
        url:{
            type:String,  //for the frontend to play the video
            required:true,
        },
        public_id:{
            type:String, //for backend to delete the video later on from cloudinary
            required:true
        }
    },
    thumbnail:{ //cloudinary url
       url:{
            type:String,  
            required:true,
       },
       public_id:{
            type:String,
            required:true
       }
    },
    title:{
        type:String,  
        required:true,
    },
    description:{
        type:String,  
        required:true,
    },
    duration:{
        type:Number,  
        required:true,
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:false,
        default:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
    


},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)

export const Video=mongoose.model("Video",videoSchema)