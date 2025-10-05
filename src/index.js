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
import { app } from './app.js';

//it's a good practise to check for app error early.
app.on("error",(err)=>{
    console.log(`Error: ${err}`);
    throw err;
}) 

connectDB()
.then(()=>{
    app.listen(process.env.PORT||5000,()=>{console.log(`🌐 Server started at port ${process.env.PORT||5000}`)}
    )
})

//CHANGED-> 
/* 
The catch inside `index.js`-connectDB() already catches and exits the process if the process is faied. So no need for such redundant process in out `index.js`(src)
.catch((err)=>{
    console.log(`MongoDB connection failure: ${err}`);
    process.exit(1)
})
    */
