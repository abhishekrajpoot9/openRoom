import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Landing from './pages/landing'
import {Route,BrowserRouter as Router,Routes} from "react-router-dom"
import Authentication from "./pages/authentication"
import { Authprovider } from './context/handleauth'
import Videomeet from './pages/videomeet'
import Home from './pages/home.jsx'
import History from './pages/History.jsx'
function App() {
  return (
    <>
      <div className="app">
      <Router>
        <Authprovider>
        <Routes>
          <Route path='/home' element={<Home/>}/>
          <Route path="" element={<Landing/>} />
          <Route path="auth" element={<Authentication/>} />
          <Route path='/:url' element={<Videomeet/>}/>
          <Route path='/history' element={<History/>}/>
        </Routes>
        </Authprovider>
        </Router>  
      </ div>
         
    </>
  )
}

export default App
