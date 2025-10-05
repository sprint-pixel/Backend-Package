import { ServerMonitoringMode } from "mongodb";
import mongoose, { mongo } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema= new mongoose.Schema({
    userName:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, //coudinary url
        required:true,
    },
    coverImage:{
        type:String //cloudinary url
    },
    watchHistory:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    },
    password:{
        type:String,
        required:['true','Password is Required']
    },
    refreshToken:{
        type:String,
    },
},{timestamps:true})


//In order to encrypt our password Only when password feild is changed.
//the `pre` method allows us to add an middleware(some conditions) just before saving changes. 
userSchema.pre("save",async function(next){
    if(this.isModified("password")){
    this.password=bcrypt.hash(this.password,10)
    next() //next() exits the procecss
    }
    //OR-Same thing
    // if(!this.isModified("password"))return next();


})

//the `bcrypt.compare()` compares and returns true/false. And since it's gonna take some time we use await.
userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password)
}

// With refresh tokens, users stay logged in for days/weeks without re-entering credentials.
// With access tokens,  Usually stores user info (like id, email, role, etc.) in the payload.
//-> Eg:
//A user logs in → server issues an access token → user uses it to fetch their profile, videos, etc.
userSchema.methods.generateAccessToken= function(){
    jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },
process.env.ACCESS_TOKEN_SECRET,{
    expiresIn: process.env.ACCESS_TOKEEN_EXPIRY
})
}
userSchema.methods.generateRefreshToken=function(){
    jwt.sign({
        _id:this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })
}
export const User=mongoose.Types("User",userSchema)