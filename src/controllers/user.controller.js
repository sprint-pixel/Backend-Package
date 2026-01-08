import { asyncHandler } from '../utils/asyncHandler.js'
import {apiError} from "../utils/apiError.js"
import { apiResponse } from '../utils/apiResponse.js'
import { User } from '../models/user.model.js'
import {deleteFromCloudinary, uploadOnCloudinary} from '../utils/cloudinary.js'
import jwt from "jsonwebtoken";
import mongoose from 'mongoose'


const generateAccessAndRefreshToken= async(userId)=>{
    try{
        const user = await User.findById(userId)
        const accessToken= user.generateAccessToken();
        const refreshToken= user.generateRefreshToken();
        
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}

    }
    catch(err){
        throw new apiError(500,"Something went wrong while generating refresh and access token")
    }
}


const refreshAccessToken = asyncHandler(async (req,res)=>{
    const userStoredRefreshToken= req.cookies.refreshToken || req.body.refreshToken;

    if(!userStoredRefreshToken){
        throw new apiError(401,"Unathorized Request-No refresh Token detected")
    }
  try { 
     const decodedToken = jwt.verify(
      userStoredRefreshToken,
      process.env.REFRESH_TOKEN_SECRET)
  
      const user=await User.findById(decodedToken?._id)
  
      if(!user){
          throw new apiError(401,"Invalid Refresh Token") 
      }
  
      if(userStoredRefreshToken !== user?.refreshToken ){
          throw new apiError(401,"Refresh token is expired or used")
      }
  
      const options={
          httpOnly:true,
          secure:true
      }
     const {accessToken,newRefreshToken}= await generateAccessAndRefreshToken(user._id)
      
      return res.status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",newRefreshToken,options)
      .json(
          new apiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access token refreshed successfully")
      )
  } catch (error) {
    throw new apiError(401,error?.message || "Invalid Refresh Token")
  }


})

const registerUser = asyncHandler(async (req,res)=>{
    /*
    1. Input email id and create a new password from frontend
    2. Validate email id, empty email?
    3. Check if user already exists:through username,email 
    4. Upload and Check for images- avatar(required),coverImage  
    5. Upload them to cloudinary: avatar,coverImage
    6. Create user object - Create entry in db
    7. Remove password and refresh token feild from response.
    8. Check for user creation
    9. Return Response(res).
    */

    const {fullName,email,userName,password}=req.body

    //2. Validation phasee: 
    // Data Validation:
    //Type1: basic if-else check: Simple and eeasy to understand, 

    /*
        if(!email|| !password){
        throw new apiError(400,"Email and Password is reequired.")
       }
         if(fullName === ""){
        throw new apiError(400,"FullName is reequired.")
       }
    */

    //Type 2: use of `some()` method pros: reduced code redundancy,standard practise in workspace
    // cons:lacks detailed user feedback..

    /*
        if([fullName,email,userName,password].some((field)=>field?.trim() === "")){
        throw new apiError(400,"All filled are required!")
        }
        else{
        new apiResponse(201,{fullName,email,userName,password},"All feilds properly filled!!")
        }
    */
   
    //Type 3: Use of `filter()` method.
    
    const requiredFeilds={fullName,email,userName,password}

    const emptyFeilds= Object.entries(requiredFeilds).filter(([key,value])=>!value?.trim())
    .map(([key])=>key) //the `Object.entries() turns our object->`requiredFeilds` into string.
                       //the `filter()`-> `!value?.trim()` keeps only those trimmed values which are empty or null
                       //the `map` is used to store the filtered items into an array with the key->(email,password,username(which are empty)...) 
    
    if(emptyFeilds.length>0){
       throw new apiError(406,`Missing feilds: ${emptyFeilds.join()}`)
    }

    //Validating Emails-Regex method.
    const emailRegex= /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if(!emailRegex.test(email)){
        throw new apiError(400,"Invalid Email Format!")
    }
    
    //3.Check if user already exists

    const existingUser= await User.findOne({//checks if the user exists with the same email and userName through User which can access the database and $or is a valid mongoose operator 
        $or:[{ email },{ userName }]
    })
    if(existingUser){
        throw new apiError(409,"User Already exists with the same email/username")
    }

    //4.Check for images,avatar-handling images

    //a. Uploading images....
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path //this or → →
    /*if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0 ){
        const coverImageLocalPath=req.files?.coverImage[0].path
    }*/

    //b.validating/checking
    
    if(!coverImageLocalPath){
        throw new apiError(400,"Cover Image file is missing")
    }
    
    if(!avatarLocalPath){
        throw new apiError(400,"Avatar Image file is missing")
    }
    
    //5. Uploading them to Cloudinary
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath);

    console.log("The Avatar upload result is: ",avatar)

    const avatarPublicId= avatar?.public_id
    const coverImagePublicId= coverImage?.public_id
    
    if(!avatar){
        throw new apiError(400,"Upload on cloudinary failed for avatar.")
    }

    if(!coverImage){
        throw new apiError(400,"Upload on cloudinary failed for coverImage.")
    }
    //6. Createe a DB call and add to DB
    const user = await User.create({
        fullName,
        avatar:avatar?.url || '',
        avatarPublicId:avatarPublicId || '',
        coverImage:coverImage?.url || '',
        coverImagePublicId:coverImagePublicId || '',
        email,
        password,
        userName:userName.toLowerCase()
    })
    
    //7 & 8.check if user has been created and if so remove password and refreshToken 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"  
    )

    if(!createdUser){
        throw new apiError(500,"Something went wrong when registering the user")
    }
    console.log("The User Data is: ",createdUser)


    //9.return response
    return res.status(201).json(
        new apiResponse(200,createdUser,"User Registered Succesfully.")
    )
})

const loginUser =  asyncHandler( async (req,res)=>{
    //1.input email/username and password || OR sign in through google api
    //2. validate email format-regex method 
    //3. check if user exists or not 
    //4. check password with the DB
    //5. if right, genarate access token and refresh token 
    //6. send to the user through  secure Cookies  
    //7. go to another interface and provide the validation code to check if it matches up 
    //8. if matched, grant the user access; else: print error.

    //1.get input
    const {email,password,userName}=req.body;

    if(!userName && !email){
        throw new apiError(406,"Either Email or Username is required.")
    }
    if(!password){
        throw new apiError(406,"Password is required.")
    }
    console.log(req.body)
    
    //2. 
    if(!userName){
    const emailRegex= /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if(!emailRegex.test(email)){
        throw new apiError(400,"Invalid Email Format!")
    }
    }
    
    //3. 
     const findUser= await User.findOne({
        $or:[{email},{userName}]
     })
     if(!findUser){
        throw new apiError(400,"User dosen't exist with the same Username|email.")
     }

     console.log("the findUser Mehtod returns: ",findUser)  
     //4.
     const isPasswordValid= await findUser.isPasswordCorrect(password); //the `isPasswordCorrect()` method is inside of our user.model.js which is returned by the instance of `findUser` in out DB.
     if(!isPasswordValid){
        throw new apiError(401,"Password isn't correct."); 
     }
     //5.
     const {accessToken,refreshToken} = await generateAccessAndRefreshToken(findUser._id);

     const loggedInUser = await User.findById(findUser._id).select("-password -refreshToken");

     const options = {
        httpOnly:true,
        secure:true, //these 2 method allows the cookies to be modified only from the backend-by defualt it could be modified by anyone on the frontend.
     }
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(
        new apiResponse(200,{
            user: loggedInUser,accessToken,refreshToken
        },"User logged in sucessfully.")
     )
     

})

const logoutUser = asyncHandler(async (req,res)=>{
   await User.findByIdAndUpdate(req.user._id,{
        // $set:{refreshToken:undefined}
        $unset:{
            refreshToken:1  //this removes the refreshToken feild from the document.
        }
    },{
        new:true,
    })

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200,{},"User logged Out Sucessfully"))

})


const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword}=req.body;

    const user = User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new apiError(400, "Invalid password")
    }
    user.password=newPassword;
    await user.save({validateBeforeSave:false})

    return res.status(200).json(
        new apiResponse(200,{},"Cuurent Password changed")
    )

})

const getCurrentUser= asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new apiResponse(
        200,
        req.user,
        "Current User fetched sucessfully."
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName && !email) {
        throw new apiError(400, "Any One feild(email or fullName) is required.")
    }
    //check for if new email that user is changing is present in another user's id.(duplicate email check) 
    const existingemail = await User.findOne({email: email});
    if(existingemail && existingemail._id.toString() !== req.user?._id.toString()){
        throw new apiError(409,"User with this email already exists.")
    } 


    if(email){
        const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName:fullName||req.user.fullName,
                email: email||req.user.email
            }
        },
        {new: true,runValidators:true }
        
    ).select("-password")
    if(!user){
        throw new apiError(400,"Not authorized to update the details.")
    }
    }
    

    return res
    .status(200)
    .json(new apiResponse(200, user, "Account details updated successfully"))
});
const  updateUserAvatar = asyncHandler(async(req, res)=>{
    const user = await User.findById(req.user?._id)
    const avatarImageLocalPath = req.file?.path  

    if(!avatarImageLocalPath){
        throw new apiError(400,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarImageLocalPath)
    if(!avatar.url){
        throw new apiError(400,"Error while uploading Avatar on cloudinary")
    }

    if(user.avatarPublicId){  //for first time usecase-the IF condition will be false
        const deleteAvatarImage = await deleteFromCloudinary(user.avatarPublicId);
        console.log("Avatar deletion successful:", deleteAvatarImage);
    }

    user.avatar= avatar.url;
    user.avatarPublicId= avatar.public_id
    await user.save()
   
    return res.status(200).json(
        new apiResponse(200,user,"User Avatar updated successfully.")
    )


})

const  updateUserCoverImage = asyncHandler(async(req, res)=>{
    const user= await User.findById(req.user?._id)
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
       throw new apiError(400,"Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new apiError(400,"Error while uploading Cover Image on cloudinary")
    }

    if(user.coverImagePublicId){ //for first time usecase
        const deleteCoverImage = await deleteFromCloudinary(user.coverImagePublicId);
        console.log("Cover Image deletion successful:", deleteCoverImage);
    }

    user.coverImage=coverImage.url
    user.coverImagePublicId= coverImage.public_id
    await user.save()   

    return res.status(200).json(
        new apiResponse(200,user,"User Cover Image updated successfully.")
    )
})

const getUserChannelProfile = asyncHandler(async(req, res)=>{
    const {userName}= req.params

    if(!userName?.toLowerCase()){
        throw new apiError(400,"Invalid Username")
    }

    const channel= await User.aggregate([
        {
            $match:{
                userName:userName?.toLowerCase()
            }
        },
        {
            //initially empty but will contain the list of subscribers and channel. For eg: `user.model.js` → { _id: ObjectId("sub001"), subscriber: ObjectId("user_john"), channel: ObjectId("user_chaiAurCode")}
            
            $lookup:{                   //connect user(_id) in the channel docs
                from:"subscriptions",        //`channel` feild for finding the number of subscribers
                localField:"_id",            
                foreignField:"channel", //loook for _id in the `channel` feild of `subscriptions` collection. 
                as:"subscribers"
            }
        },
        {
            $lookup:{                         //connect user(_id) in the subscriber docs
                from:"subscriptions",           //`subscriber` feild for finding the number of channels, a particular channel is subscribed to.
                localField:"_id",               
                foreignField:"subscriber",      //look for _id in the `subscriber` feild of `subscriptions` collection.
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{                 //used to add number of `$channel`
                    $size: "$subscribers"         //one by one.`$subscribers`→`$channel`
                },
                channelsSubscribedToCount:{      //used to add number of `channel` a  channel itself is subscribed to. The above comment is of the actual mechanism of `$size` while it explains the ABSTRACTION of the feild.
                    $size: "$subscribedTo"      
                },
                isSubscribed:{
                    $cond: {
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]}, //IF User 
                        then:true,       //is in the subscriber list. It looks through
                        else:false       //the subscriber list of a particular channel.
                    }                    //if true: Frontend guy does `SUBSCRIBED 🛎️`
                }                        //if false: Frontend guy does `SUBSCRIBE🔔`
            }
        },
        {
            $project:{
                fullName: 1,
                userName: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
            }
        }
    ])

    if(!channel?.length){
        throw new apiError(404,"Channel does not exist")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,channel[0],"User Channel Fetched Succefully.")
    )
    

})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: req.user?._id      
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",             //search for the particular _id in the array of watchHistory in the `videos` collection.
                as:"watchHistory",
                pipeline:[   //used to add another pipeline inside a existing pipeline. `populate` is a option too
                    {    
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        userName:1,
                                        fullName:1,
                                        avatar:1  
                                    }
                                }
                            ]
                        },
                    },
                    {
                        $addFields:{
                            owner:{
                                 $first:"$owner", //to convert the owner array to object.Gets the first element of the array -Frontend guy will get appreciate it.
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse(200,user[0].watchHistory,"Watch History fetched successfully.")
    )
})
export{
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory 
}