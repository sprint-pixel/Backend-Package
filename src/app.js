import express from 'express'
import cookieParser from 'cookie-parser';
import cors from 'cors'
import { getTokenSourceMapRange } from 'typescript';

const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials:true,
}));
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

export {app};