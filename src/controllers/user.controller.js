import { asyncHandler } from '../utils/asyncHandler.js'
import {apiError} from "../utils/apiError.js"
import { apiResponse } from '../utils/apiResponse.js'
import { User } from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import jwt from "jsonwebtoken";


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
    console.log(`req.body:`,req.body)

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
    console.log("Existing User?`:",existingUser)
    if(existingUser){
        throw new apiError(409,"User Already exists with the same email/username")
    }

    //4.Check for images,avatar-handling images

    //a. Uploading images....
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path //this or → → →
    /*if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0 ){
        const coverImageLocalPath=req.files?.coverImage[0].path
    }*/
    console.log(`req.files Format:`,req.files)

    //b.validating/checking
    if(!avatarLocalPath){
        throw new apiError(400,"Avatar Image is required!")
    }
    
    //5. Uploading them to Cloudinary
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage= uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new apiError(400,"Avatar file is required-> Upload on cloudinary failed.")
    }
    //6. Createe a DB call and add to DB
    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
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
        $set:{refreshToken:undefined}
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

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const userStoredRefreshToken= req.cookies.refreshToken || req.body.refreshToken;

    if(!userStoredRefreshToken){
        throw new apiError(401,"Unathorized Request(No refresh Token detected in the system)")
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
export{registerUser,loginUser,logoutUser,refreshAccessToken}