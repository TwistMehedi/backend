import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import database from "./db/database.js";
dotenv.config();

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",

}))

const port = process.env.port || 3000;

app.listen((port),()=>{
    database();
    console.log(`server run is ${process.env.PORT} number`);
})