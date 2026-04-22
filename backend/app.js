import express from 'express';//it handle backend logic and receive req and give res 
const app = express();
import {createServer} from "node:http";//it is used for creating the server between io socket and express
import { Server } from "socket.io";
import { status } from "http-status";//it is helpfull for showing error like "page not found " and other error automatically
import cors from "cors"; //it is used for security purpose and search about this to get more information 
import mongoose from "mongoose";// for mogoo db we use mongoose
import router from './routes/user.rutes.js';// used for access the routers 
import {ConnectWithServer} from './controllers/soket.js';
const server=createServer(app);//create server between io and express
const io=ConnectWithServer(server);

//middlewares-------------
app.set("port",(process.env.PORT || 8000));
app.use(cors());//it is used when diffrent port and or domains you used in your project so it helpfull that both frontend and backend talk with each other
app.use(express.urlencoded({extended:true,limit:"100kb"}));//  it is used for handle the form data from frontend and make the data  available in req.body
app.use(express.json(({limit:"100kb"})));// it is used for to convert json into js object

app.use("/users",router);


const start=async()=>{
app.set("mongo_user")
const connectionDb= await mongoose.connect("mongodb+srv://abhishekrajpoot988_db_user:vQ5pwEkIwxWnTB7n@cluster0.j1xo1eg.mongodb.net/?appName=Cluster0")
console.log(`mongo connected db Host:${connectionDb.connection.host}`)
server.listen(app.get("port"),()=>{
  console.log("port listen on port 8000")
 
})
} 
start();

app.get("/home",(req,res)=>{
  return res.json({"hello":"abhi"})
  // res.send("hjg")
})