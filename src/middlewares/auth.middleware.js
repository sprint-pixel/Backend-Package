//purpose:to verify if user exists or not
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model";


export const verifyJWT = asyncHandler(async (req,_,next)=>{ //the `res` wasn't used so wew can replace it with `_`
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token){
            throw new apiError(401,"Unathorized request")
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new apiError(401,"Invalid access Tokne")
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new apiError(401,"Invalid Access Token. ")
        
    }

})