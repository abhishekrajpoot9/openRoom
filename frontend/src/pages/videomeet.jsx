import React, { use, useEffect, useRef, useState } from 'react'
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import "../css/videomeet.css"
import "../css/videomeetinner.css"
import { io } from "socket.io-client"
import IconButton from '@mui/material/IconButton';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import Badge from '@mui/material/Badge';
import ChatIcon from '@mui/icons-material/Chat';
import Box from '@mui/material/Box';
import SendIcon from '@mui/icons-material/Send';
import { useNavigate } from "react-router-dom";


export default function Videomeet() {
  const server_url = "http://localhost:8000";

  
  // ─── Refs ─────────────────────────────────────────────────────────────────
  const connections = useRef({});          // all peer connections
  const socketRef = useRef();              // Socket.io connection
  const socketIdRef = useRef();            // your own socket ID
  const localVideoRef = useRef();          // your own camera video element
  const videoRef = useRef([]);             // ✅ tracks all remote video streams
  const iceCandidateQueue = useRef({});    // ✅ queues ICE candidates before SDP is ready
const messageRef=useRef("");
  // ─── State ────────────────────────────────────────────────────────────────
  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [video, setVideo] = useState(false);
  const [audio, setAudio] = useState(false);
  const [screen, setScreen] = useState(false);
  const [showModel, setShowModel] = useState(true);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);
  let [messages, setMessages] = useState([]);
  // let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  const peerConfigConnections = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  }

  // ─── Silence & Black Screen Helpers ───────────────────────────────────────

  // Creates a silent audio track (used as fallback when no mic)
  let audioSilence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  }

  // Creates a black video track (used as fallback when no camera)
  let blackScreen = (width = 680, height = 480) => {
    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  }

  // Combines black video + silent audio into one fallback stream
  let blacksilence = (...args) => new MediaStream([blackScreen(...args), audioSilence()]);

  // ─── Get Permissions ──────────────────────────────────────────────────────

  const getPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setVideoAvailable(true);
      setAudioAvailable(true);
      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

      window.localStream = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.log(err);
      setVideoAvailable(false);
      setAudioAvailable(false);
    }
  }

  useEffect(() => {
    getPermissions();
  }, []);

  // ─── getUserMedia (camera/mic toggle) ─────────────────────────────────────

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices.getUserMedia({ video, audio })
        .then(stream => getUserMediaSuccess(stream))
        .catch(e => console.log(e));
    } else {
      // No video or audio — stop tracks and fall back to blacksilence
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(t => t.stop());
      } catch (e) { console.log(e); }

      // ✅ Fall back to blacksilence when camera/mic turned off
      window.localStream = blacksilence();
      localVideoRef.current.srcObject = window.localStream;

      // Re-send blacksilence to all peers
      for (let id in connections.current) {
        connections.current[id].addStream(window.localStream);
        connections.current[id].createOffer().then(description => {
          connections.current[id].setLocalDescription(description).then(() => {
            socketRef.current.emit("signal", id, JSON.stringify({
              "sdp": connections.current[id].localDescription
            }));
          }).catch(e => console.log(e));
        });
      }
    }
  }

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [video, audio]);

  // ─── getUserMediaSuccess ───────────────────────────────────────────────────

  const getUserMediaSuccess = (stream) => {
    // Step 1 — Stop old tracks
    try {
      window.localStream.getTracks().forEach(t => t.stop());
    } catch (e) { console.log(e); }

    // Step 2 — Set new stream
    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    // Step 3 — Update all peer connections with new stream
    for (let id in connections.current) {
      if (id === socketIdRef.current) continue;
      connections.current[id].addStream(window.localStream);
      connections.current[id].createOffer().then(description => {
        connections.current[id].setLocalDescription(description).then(() => {
          socketRef.current.emit("signal", id, JSON.stringify({
            "sdp": connections.current[id].localDescription
          }));
        }).catch(e => console.log(e));
      });
    }

    // Step 4 — When a track ends naturally, fall back to blacksilence
    stream.getTracks().forEach(track => {
      track.onended = () => {
        setVideo(false);
        setAudio(false);
        try {
          let tracks = localVideoRef.current.srcObject.getTracks();
          tracks.forEach(t => t.stop()); // ✅ renamed to t to avoid clash
        } catch (e) { console.log(e); }

        // Replace with blacksilence
        window.localStream = blacksilence();
        localVideoRef.current.srcObject = window.localStream;

        // Re-send to all peers
        for (let id in connections.current) {
          connections.current[id].addStream(window.localStream);
          connections.current[id].createOffer().then(description => {
            connections.current[id].setLocalDescription(description).then(() => {
              socketRef.current.emit("signal", id, JSON.stringify({
                "sdp": connections.current[id].localDescription
              }));
            }).catch(e => console.log(e));
          });
        }
      }
    });
  }

  // ─── getDisplayMedia (screen share) ──────────────────────────────────────

  const getDisplayMediaSuccess = (stream) => {
    // Stop old tracks
    try {
      window.localStream.getTracks().forEach(t => t.stop());
    } catch (e) { console.log(e); }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    // ✅ Fixed — was connections[id] instead of connections.current[id]
    // ✅ Fixed — was createOffer. (dot) instead of createOffer() (call)
    for (let id in connections.current) {
      if (id === socketIdRef.current) continue;
      connections.current[id].addStream(window.localStream);
      connections.current[id].createOffer().then(description => {
        connections.current[id].setLocalDescription(description).then(() => {
          socketRef.current.emit("signal", id, JSON.stringify({
            "sdp": connections.current[id].localDescription
          }));
        }).catch(e => console.log(e));
      });
    }

    // When screen share track ends, fall back to blacksilence
    stream.getTracks().forEach(track => {
      track.onended = () => {
        setScreen(false);
        try {
          window.localStream.getTracks().forEach(t => t.stop());
        } catch (e) { console.log(e); }

        window.localStream = blacksilence();
        localVideoRef.current.srcObject = window.localStream;

        for (let id in connections.current) {
          connections.current[id].addStream(window.localStream);
          connections.current[id].createOffer().then(description => {
            connections.current[id].setLocalDescription(description).then(() => {
              socketRef.current.emit("signal", id, JSON.stringify({
                "sdp": connections.current[id].localDescription
              }));
            }).catch(e => console.log(e));
          });
        }
      }
    });
  }

  const getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .catch(e => console.log(e));
      }
    }
  }

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen]);

  // ─── gotMessageFromServer ──────────────────────────────────────────────────

  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (!connections.current[fromId]) return; // ✅ safety check

      const pc = connections.current[fromId];

      if (signal.sdp) {
        pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              pc.createAnswer().then(description => {
                pc.setLocalDescription(description).then(() => {
                  socketRef.current.emit("signal", fromId, JSON.stringify({
                    sdp: pc.localDescription
                  }));
                });
              });
            }

            // ✅ ICE Fix — flush any queued ICE candidates now that SDP is ready
            if (iceCandidateQueue.current[fromId]) {
              iceCandidateQueue.current[fromId].forEach(candidate => {
                pc.addIceCandidate(new RTCIceCandidate(candidate))
                  .catch(e => console.log(e));
              });
              iceCandidateQueue.current[fromId] = []; // clear queue
            }
          })
          .catch(e => console.log(e));
      }

      if (signal.ice) {
        if (pc.remoteDescription) {
          // ✅ SDP already set — safe to add ICE immediately
          pc.addIceCandidate(new RTCIceCandidate(signal.ice))
            .catch(e => console.log(e));
        } else {
          // ✅ SDP not ready — queue ICE for later
          if (!iceCandidateQueue.current[fromId]) {
            iceCandidateQueue.current[fromId] = [];
          }
          iceCandidateQueue.current[fromId].push(signal.ice);
        }
      }
    }
  }

  // ─── addMessage ───────────────────────────────────────────────────────────

  const addMessage = (sender, data, socketIdSender) => {
    setMessages(prevMessages => [...prevMessages, { sender, data, socketIdSender }]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages(prevCount => (prevCount || 0) + 1);
    }
  }

  //to show receving messages send from sender
  let addMessages=(data,sender,socketIdSender)=>{
    setMessages((prevMessages)=>[
      ...prevMessages,
      {sender:sender,data:data}
    ]);
    if(socketIdSender!==socketIdRef.current){
      setNewMessages((prevMessages)=>prevMessages+1);
    }
  }
  // ─── connectToSocketServer ────────────────────────────────────────────────

  const connectToSocketServer = () => {
    socketRef.current = io(server_url);
    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit("please-join", window.location.href);

      socketRef.current.on("chat-message", addMessage);

      // ✅ renamed to prev and v to avoid clash with video state
      socketRef.current.on("user-left", (id) => {
        setVideos(prev => prev.filter(v => v.socketId !== id));
      });

      socketRef.current.on("joined-user", (id, clients) => {
        clients.forEach(socketListId => {
          if (connections.current[socketListId]) return; // already connected

          const pc = new RTCPeerConnection(peerConfigConnections);
          connections.current[socketListId] = pc;

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socketRef.current.emit("signal", socketListId, JSON.stringify({
                ice: event.candidate
              }));
            }
          };

          // ✅ renamed all loop vars to v to avoid clash with video state
          pc.ontrack = (event) => {
            const stream = event.streams[0];
            setVideos(prev => {
              const exists = prev.find(v => v.socketId === socketListId);
              if (exists) {
                const updated = prev.map(v =>
                  v.socketId === socketListId ? { ...v, stream } : v
                );
                videoRef.current = updated;
                return updated;
              }
              const updated = [...prev, { socketId: socketListId, stream }];
              videoRef.current = updated;
              return updated;
            });
          };

          if (window.localStream) {
            window.localStream.getTracks().forEach(track => {
              pc.addTrack(track, window.localStream);
            });
          } else {
            // ✅ No stream available — use blacksilence fallback
            window.localStream = blacksilence();
            window.localStream.getTracks().forEach(track => {
              pc.addTrack(track, window.localStream);
            });
          }
        });

        if (id === socketIdRef.current) {
          Object.entries(connections.current).forEach(([id2, pc]) => {
            if (id2 === socketIdRef.current) return;
            pc.createOffer().then(description => {
              pc.setLocalDescription(description).then(() => {
                socketRef.current.emit("signal", id2, JSON.stringify({
                  sdp: pc.localDescription
                }));
              });
            });
          });
        }
      });
    });
  }
  
  // ─── Button Handlers ──────────────────────────────────────────────────────

  const handleVideo = () => {
    setVideo(!video);
  }

  const handleAudio = () => {
    setAudio(!audio);
  }

  const handleScreen = () => {
    setScreen(!screen);
  }
  let sendMessage=()=>{
               if (!messageRef.current) return;
                
               
socketRef.current.emit("chat-message",messageRef.current,username);
messageRef.current="";


  }
  let routeTo=useNavigate();
  const handleEndCall = () => {
    // Stop all local tracks
    if (window.localStream) {
      window.localStream.getTracks().forEach(t => t.stop());
    }
    // Close all peer connections
    Object.values(connections.current).forEach(pc => pc.close());
    // Disconnect socket
    if (socketRef.current) socketRef.current.disconnect();
    // Go back to lobby
    setAskForUsername(true);
    setVideos([]);
    routeTo("/Home")
  }

  // ─── Connect Flow ─────────────────────────────────────────────────────────

  const connect = () => {
    setAskForUsername(false);
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  }

  // ─── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      Object.values(connections.current).forEach(pc => pc.close());
      if (window.localStream) {
        window.localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {askForUsername ? (
        // ── Lobby Screen ──
        <div>
          <h2>Enter into Lobby</h2>
          <TextField
            label="Username"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button variant="contained" onClick={connect}>Join</Button>
          <video ref={localVideoRef} autoPlay muted />
        </div>
      ) : (
        // ── Meeting Screen ──
        <div className='vcontainer'>
          {showModel?<div className="chatSection">
            <div className="receiveChat">
<h1>openRoom Chat</h1>
<br />
<hr />
<br />
  <div className="chattingDisplay">
    {messages.map((item,index)=>{
      return(
        <div key={index} style={{marginBottom:3}}>
          <p style={{fontWeight:"bold"}}><h2>{item.sender}</h2>
           {item.data}
          </p>
        </div>
      )
    })}
  </div>
  <div className="sendChat">
    <div className='textareacontainer'>
  <Box sx={{ width: 500, maxWidth: '60%', position:'relative' }}>
  <div className="iconSend">

<IconButton  onClick={sendMessage}>
  <span><SendIcon/></span>

</IconButton>

</div>  
      <TextField fullWidth label="enter here..." id="fullWidth"  sx={{ '& .MuiOutlinedInput-root':{
        borderRadius: '999px',paddingRight:'50px' 
      }}} onChange={(e)=>{messageRef.current=e.target.value}}/>
        
    </Box>
  </div>
  </div>
</div>
</div>:<></>}
          {/* ── Control Buttons ── */}
          <div className="buttonContainer">

           
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton onClick={handleEndCall} style={{ color: "white" }}>
              <CallEndIcon />
            </IconButton>

            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            
            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton>
            ) : <></>}

            {/* Chat with notification badge */}
            <Badge badgeContent={newMessages} max={999} color='secondary'>
              <IconButton onClick={()=>setShowModel(!showModel)} style={{ color: "white" }}>
                <ChatIcon />
              </IconButton>
            </Badge>

          </div>

          {/* ── Your own video — bottom right corner ── */}
          <video className='yourVideo' ref={localVideoRef} autoPlay muted />

          {/* ── Other users' videos ── */}
          <div className='userConferenceVideo'>
            {videos.map(v => ( // ✅ v — no clash with video state
              <div key={v.socketId}>
                <video
                  data-socket={v.socketId}
                  ref={ref => {
                    if (ref && v.stream) {
                      ref.srcObject = v.stream;
                    }
                  }}
                  autoPlay
                />
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}