import React from 'react'
import { Link, Route } from "react-router-dom";
import { FaWalking } from "react-icons/fa";
import "../css/landing.css"
import img from "./front2.png"
import { useNavigate } from 'react-router-dom';
export default function Landing() {//file start always should be capital latter
  let route =useNavigate();
 
  return (
    <div className='homepage'>
        <nav>
           <div className="first" style={{cursor:'pointer'}} onClick={()=>{
            route("/")
           }}>
            <h2>Home</h2>
           </div>
           <div className="second">
           
           
           <p onClick={()=>{
            route("/auth")
           }}>Register</p>
           
            <p style={{cursor:'pointer'}} onClick={()=>{
              route("/auth")
            }}>Login</p>
        
           </div>
        </nav>
        <div className='bodysection'>
          <div className='bfirst'>
            <h1>Joined with your  <span>openRoom</span></h1>
            <br /><br />
            <h4><span><FaWalking /></span> Run your distance by Vcall</h4> <br /><br />
            <div className='forbutton'>
              
            {/* <Link to="/auth" > */}
  <button onClick={()=>{
    let token=localStorage.getItem("token");
    if(token){
      route("/home")
    }else{
      route("/auth")
    }
  }}>Get Start</button>
{/* </Link> */}
            </div>
            
           </div>
          <div className='bmiddle'>
          <img src={img} alt="" />
            </div> 
          <div className='blast'></div>
        </div>
    </div>
  )
}
