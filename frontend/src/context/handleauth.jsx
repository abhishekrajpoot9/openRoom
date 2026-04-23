//here is one todo.
import { createContext,useContext } from "react";

import React from "react";

import axios, { HttpStatusCode } from "axios";
import { useNavigate,Navigate } from "react-router-dom";
import server from "../enviroment";
export const Authcontext= createContext({});//authcontext store data globally
const client=axios.create({
    baseURL:`${server}/users`
})
export const Authprovider=({children})=>{
    
    const [Userdata,setUserdata]=React.useState(null);
 
    const handleRegister= async(name,username,password)=>{
        try{
            let request=await client.post("/register",{
                name:name,
                username:username,
                password:password
            })
            if(request.status==HttpStatusCode.Created){
                return request.data.message;
            }
        }catch(err){
            throw  err;
            
        }
    }
    const handleLogin=async(username,password)=>{
        try{
            let request=await client.post("/login",{
                username:username,
                password:password,
            }) 
            if(request.status==HttpStatusCode.Ok){
                localStorage.setItem("token",request.data.token)
                //------
                setUserdata(request.data.user)//todo
                //------
                return request.data;
            }
        }catch(err){
            throw err;
        }
    }
    const getHistoryOfUser=async()=>{
        try{
            let request=await client.get("/get_all_activity",{
                params:{
                  token:  localStorage.getItem("token")
                }
            });
            return request.data
        }catch(err){
            throw err;
        }
    }
    const addToUserHistory=async(meetingCode)=>{
       try{
        let request=await client.post("/add_to_activity",{
            token:localStorage.getItem("token"),
            meeting_code:meetingCode
        });
    return request
       }catch(e){
        throw e;
       }
    }
    const data={
    Userdata,setUserdata,handleRegister,handleLogin,getHistoryOfUser,addToUserHistory
}
return (
    <Authcontext.Provider value={data}>
        {children}
    </Authcontext.Provider>
)
}
