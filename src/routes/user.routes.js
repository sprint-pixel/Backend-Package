import { Router } from "express"
import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router= Router()

router.route("/register").post( //FILE HANDLING 
    //adding multer middleware-adding the middleware `upload` that can support handling multiple files in the form of array before transferring the route to the `user.controller`  
    upload.fields([ 
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ])
    ,registerUser
)

router.route("/login").post(loginUser)

//secured Routes-only when loggedIn

router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router