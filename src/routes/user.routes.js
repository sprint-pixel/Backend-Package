import { Router } from "express"
import { registerUser } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"

const router= Router()

router.route("/register").post(
    upload.fields([ //adding multer middleware.
        {
            name:"avatar",
            maxCount:1
        },
        {
            namee:"coverImage",
            maxCount:1
        }
    ])
    ,registerUser
)
export default router