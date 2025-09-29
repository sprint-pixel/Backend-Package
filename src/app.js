import express from 'express'
import cookieParser from 'cookie-parser';
import cors from 'cors'

const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:8000",
    credentials:true,
}));
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

//routes
import userRouter from './routes/user.routes.js'

//routes declaration 
app.use("/api/v1/users",userRouter)
//Here files used -> `user.routes.js & `user.controller.js`.
//Mechanism:User requests `//localhost:8000/api/v1/users` then `app.use()` transfers the request to `userRouter`. Inside `userRouter`,it routes to `/register` and calls the controller `registerUser` from `user.controller.js` . 
// This allows us to keep the `app.js` less messy and seperated functionality with modularity. We can easily change the rquired routes inside the `userRouter` file and modify controllers too. 
//**This is STANDARD PRACTISE*/

export {app};