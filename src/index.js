// require ('dotenv').config({path:'./env'});
import dotenv from 'dotenv';

dotenv.config({
    path:'./.env'
})

//METHOD NO.1 -> to connect Database.
/*
import express from 'express'
const app=express()
//IIFE-> Immediately Invoked Funciton Execution, Syntax= `()()` the () at the end invokes the function and executes immediately.

;( async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error",(err)=>{
            console.log(`Error:`,err);
            throw err;
        });
        app.listen(process.env.PORT,()=>{
            console.log("Server started at port: ",process.env.PORT)
        })

    }
    catch(err){
        console.error("Error:",err);
        throw err;
    }
})()
*/


// METHOD NO.2 -> importing from db folder (keeping our index.js file clean.)
import connectDB from './db/index.js';

//it's a good practise to check for weeoe before connecitng our db.
app.on("error",(err)=>{
    console.log(`Error: ${err}`);
    throw err;
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,
        console.log(`Server started at port ${process.env.PORT||8000}`)
    )
}) 
.catch((err)=>{
    console.log(`MongoDB connection failure: ${err}`);
    process.exit(1)
})
