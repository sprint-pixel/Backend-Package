import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    const dbStatus = mongoose.connection.readyState;

    if(dbStatus !== 1){ //1 means connected
        throw new apiError(500, "Database connection not healthy")
    }

    return res
    .status(200)
    .json(new apiResponse(200, {status : "OK", dbStatus}, "Health check passed: System is up and running"))
})

export {
    healthcheck
    }
    