import React, { useContext, useState } from 'react'
import withAuth from '../utils/isautheticate';
import "../css/home.css"
import HistoryIcon from '@mui/icons-material/History';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import GroupsIcon from '@mui/icons-material/Groups';
import Button from '@mui/material/Button';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import homeSvg from "./home.svg";
import { useNavigate } from 'react-router-dom';
import { Authcontext } from '../context/handleauth';
 function Home() {
  const navigate=useNavigate();
  const[meetingCode,setMeetingCode]=useState("");
  const{addToUserHistory}=useContext(Authcontext);
  let handleJoinCall=async()=>{
    await addToUserHistory(meetingCode)
navigate(`/${meetingCode}`)
  }
  return (
    <div className="topcontainer">
    <div className='navBarContainer'>
      <nav>
        <div className="navfirst">
          <div className="navinnerfirst">

          <h1 style={{cursor:"pointer"}} onClick={()=>{
navigate("/")}}>openRoom</h1>
          </div>
          <div className="navinnersecond">
<h1>|</h1>
          </div>
          

          
          <div className="navinnerfourth" >
            <IconButton onClick={()=>{
              {navigate("/history")} 
            }} style={{color:"white"}}>
<HistoryIcon/>
<p>History</p>
            </IconButton>
          </div>
           
        </div>

        <div className="navsecond">
         <button style={{background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  fontSize: "inherit",
  color: "inherit" 
  }} onClick={()=>{localStorage.removeItem("token"); navigate("/")}}>LogOut</button>
        </div>
      </nav>
      </div>
      
<div className="meetingtop">
        <div className='cardofM'>
          <div className="mupper">
            <div className="miupper">
<IconButton >
<GroupsIcon/>
</IconButton>
<br /><br />
          </div> 
<h1>Join a Meeting</h1>
<br />
<span>
<h3>Enter the Meeting code to get start</h3></span>
          </div>
          
         <div className="svg">
          <img src={homeSvg} alt="" style={{width:300,height:200}}/>
         </div>
        <div className="fortextfield">
         <div>
          <p><b>Create or Join Meeting</b></p>
        <TextField onChange={e=>setMeetingCode(e.target.value)} id="outlined-basic"  variant="outlined" style={{width:400 ,}} />
         </div>
         <div>
         <Button onClick={handleJoinCall} variant="contained" >
         
         join meeting &nbsp; &nbsp;<ArrowForwardIcon/>
         </Button>
         </div>
    
        </div>
      </div>
      
    </div>
    </div>
  )
}
export default withAuth(Home);
