import  React ,{useEffect} from 'react';
import { useState } from "react";
import { Snackbar, Button } from "@mui/material";
// import {useContext } from "react";
import "../css/authentication.css"
import { useNavigate } from 'react-router-dom';
import { Authcontext } from '../context/handleauth';
export default function Example() {
  let[Username,setUsername]=React.useState("");
  let[Name,setName]=React.useState("");
  let[Password,setPassword]=React.useState("");
  let[Error,setError]=React.useState("");
  let[Message,setMessage]=React.useState("");
  let[Formstate,setFormstate]=React.useState(0);
  let[Open,setOpen]=React.useState(false)
  
  const {handleRegister,handleLogin}=React.useContext(Authcontext);    //any component read data from authcontext
  const navigat=useNavigate();
  const authhandle = async () => {
    try {
      let result;
  
      if (Formstate === 0) {
        // LOGIN
        result = await handleLogin(Username, Password);
navigat("/home")
      } else {
        // REGISTER
        result = await handleRegister(Name, Username, Password);
        setFormstate(0)
        setPassword("")
        setUsername("")
        setMessage(result);
        setOpen(true);
      }
     
  
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || "Something went wrong";
  
        console.log(err.response.data)
      setMessage(errorMessage);
      setOpen(true);
      setName("")
      setUsername("")
      setPassword("")

    }
  };

  return (
    

    <div className='maincontainer'>
    <div className="card">
      {Formstate===0?
      <h1>Sign in</h1>
    :<h1>Register</h1>}
      
      {Formstate===1 ?
      <div className='name'>
        <label htmlFor="name">Name</label><br />
        <input type="text" id='name' name='name' placeholder='Name' value={Name}
  onChange={(e) => setName(e.target.value)} autoFocus required/>
      </div>
      :""}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <div className='user'>
        <label htmlFor="username">Username</label><br />
        <input type="text" id='username' name='username' placeholder='Username' value={Username}
  onChange={(e) => setUsername(e.target.value)} autoFocus required/>
      
      </div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      
      <div className='pass'>
        <label htmlFor="password">Password</label> <br />
        <input type="password" name='password' id='password' placeholder='Password'  value={Password}
  onChange={(e) => setPassword(e.target.value)} autoFocus required />
      <p style={{color:"red"}}>{Error}</p>
        
      </div>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      
      <div className='button'>
<button  type='submit' onClick={authhandle}>{Formstate==0?"Sign in" : "Register"}</button>

      </div>
      
            {Formstate===0?
      <p><a href="#" onClick={()=>setFormstate(1)}>Dont't have an account? Register now</a></p>
            :<p><a href="#" onClick={()=>setFormstate(0)}> have an account? Sign in now</a></p>}
    </div>
<Snackbar
open={Open}
autoHideDuration={4000}
message={Message}
onClose={() => setOpen(false)}
/>


  </div>
       
    
  );
}
