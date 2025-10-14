//**IMP:This is a practise file for myself to understand the logic and code flow.It contains the working bug free code without all the comments and hassle. It is easy to read and understand** */
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const testController= asyncHandler(async (req,res)=>{

    //1. Input email,password,userName 
    const {email,userName,fullName,password}=req.body
    console.log(`Email: ${email}, UserName: ${userName}`)

    //2,verify the feilds if missing and the email format 

    const requiredFeilds = {email,userName,fullName,password}

    const checkFeilds=Object.entries(requiredFeilds).filter(([key,value])=>!value?.trim()).map(([key])=>key)

    if(checkFeilds.length>0){
        throw new apiError(406,`Field missing: ${checkFeilds.join(",")}`)
    }

    const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if(!emailRegex.test(email)){
        throw new apiError(406,`Provided email is not in a valid format! ${email}`)
    }
    //3.check if user already exists

    const checkExistingUser= await User.findOne({
        $or:[{email},{userName}]
    })
    if(checkExistingUser){
        throw new apiError(400,`User already exists with the same user name and email.`)
    }

    //4.upload avatar,coverImage through multer
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath =  req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new apiError(406,`Avatar is Required.`)
    }
    //5. upload them to cloudinary
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage= coverImageLocalPath? await uploadOnCloudinary(coverImageLocalPath) : null
    
    if(!avatar){
        throw new apiError(406,`Upload to cloudinary failed.`)
    }
    //6. Add them to DB
    const createUser= await User.create({
        fullName,
        coverImage:coverImage.url || "",
        avatar:avatar.url,
        email,
        password,
        userName:userName.toLowerCase()
    })
    console.log(`User Created in DB: ${createUser}`)
    //7. remove password and refresh token 

    const returnUser = await User.findById(createUser._id).select("-password -refreshToken")

    if(!returnUser){throw new apiError(500,`Something went wrong while registering the user `)}

    //8. return the response to the frontend

    return res.status(201).json(new apiResponse(201,returnUser,`User Created Sucesfully!!`))

})

export {testController}
