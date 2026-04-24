import { StatusCodes } from "http-status-codes";//help to show the status
import { User } from "../models/userschema.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meetingSchema.js";
import { name } from "ejs";
// LOGIN
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Please enter all details" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid username or password" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.token = token;
    await user.save();

    return res.status(StatusCodes.OK).json({ token,user:{
     name:user.name,
     username:user.username
    } });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong", error });
  }
};

// REGISTER
const register = async (req, res,) => {
  try {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ message: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);//Bcrypt automatically salts + hashes

    const newUser = new User({
      name,
      username,
      password: hashPassword,
    });

    await newUser.save();

    return res
      .status(StatusCodes.CREATED)
      .json({ message: "User registered successfully" });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong", error });
  }
 
};

const getUserHistory=async (req,res)=>{
  const{token}=req.query;
  try{
    const user=await User.findOne({token:token});
    if (!user) return res.status(401).json({ message: "Invalid token" });
    console.log("user.username:", user.username); 
    const meetings=await Meeting.find({user_id:user.username})
    console.log("meetings found:", meetings); 
    res.json(meetings)
  }catch(e){
    res.json({message:`something went wrong ${e}`})
  }
}
const addToHistory=async(req,res)=>{
  const {token,meeting_code}=req.body;
  try{
    const user=await User.findOne({token:token});
    const newMeeting=new Meeting({
      user_id:user.username,
      meetingCode:meeting_code

    })
    await newMeeting.save();
    res.status(StatusCodes.CREATED).json({message:"code added on history"})
  }catch(e){
    res.json({message:`something went wrong ${e}`})
  }
}
export { login, register,getUserHistory,addToHistory };
