import mongoose from "mongoose";

import { DB_NAME } from "../constants.js";

const connectDB= async ()=>{
    try{
        // console.log("Mongo URI →", process.env.MONGODB_URI);
        // console.log("Final URI →", `${process.env.MONGODB_URI}/${DB_NAME}`);

        const connectInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected!! DB host: ${connectInstance.connection.host}`);

    }
    catch(error){
        console.log("MONGODB connection Failure: ", error);
        process.exit(1);
    }
}

export default connectDB;
