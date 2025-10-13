import { asyncHandler } from '../utils/asyncHandler.js'
import {apiError} from "../utils/apiError.js"
import { apiResponse } from '../utils/apiResponse.js'
import { User } from '../models/user.model.js'
import {uplooadOnCloudinary} from '../utils/cloudinary.js'
import { apiResponse } from '../utils/apiResponse.js'

const registerUser = asyncHandler(async (req,res)=>{
    /*
    1. Input email id and create a new password from frontend
    2. Validate email id, empty email?
    3. Check if user already exists:through username,email 
    4. Check for images, avatar  
    5. Upload them to cloudinary, avatar  
    6. Create user object - Create entry in db
    7. Remove password and reefresh tokeen feild from reesponse-when response ocurs it returns all the feild, so we remove the password and refresh token feild.
    8. Check for user creation-checking for normal response or user creation  
    9. Return Response(res).
    */

    const {fullName,email,userName,password}=req.body
    console.log(`Email: ${email} & FullName: ${fullName}`);

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
    
    if(emptyFeilds>0){
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
    console.log("Registered User:",existingUser)
    if(existingUser){
        throw new apiError(409,"User Already exists with the same email/username")
    }

    //4.Check for images,avatar-handling images

    //a. Uploading images....
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.converImage[0]?.path

    //b.validating/checking
    if(!avatarLocalPath){
        throw new apiError(400,"Avatar Image is required.")
    }
    const avatar= await uplooadOnCloudinary(avatarLocalPath)
    const coverImage= await uplooadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new apiError(400,"Avatar file is required.")
    }
    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        userName:userName.toLowerCase()
    })
    
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"  //wierd syntax ik!
    )

    if(!createdUser){
        throw new apiError(500,"Something went wrong when registering the user")
    }


    return res.status(201).json(
        new apiResponse(200,createdUser,"User Registered Succesfully.")
    )
})

export{registerUser}