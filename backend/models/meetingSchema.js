import mongoose from "mongoose";
import { Schema } from "mongoose";
const meetingschema=new Schema({
 user_id:{
    type:String,

 },
 meetingCode:{
type:String,
required:true,
 },
 date:{
    type:Date,
    default:Date.now,
    required:true,
 }
})
const Meeting=mongoose.model("Meeting",meetingschema);
export { Meeting};
