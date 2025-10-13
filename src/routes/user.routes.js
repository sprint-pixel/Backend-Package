import { Router } from "express"
import { registerUser } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"

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
export default router