import React, { useEffect, useRef, useState } from 'react'
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
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
import server from '../enviroment';


const RemoteVideo = ({ socketId, stream }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <div className="remoteVideoWrapper">
      <video ref={ref} autoPlay playsInline />
    </div>
  );
};

// ─── grid class based on participant count ───
// it drives the Css layout (1-col, 2-col, 3-col, etc.)
const getGridClass = (count) => {
  if (count <= 1) return '';
  if (count === 2) return 'p2';
  if (count === 3) return 'p3';
  if (count === 4) return 'p4';
  if (count === 5) return 'p5';
  if (count === 6) return 'p6';
  if (count <= 9) return `p${count}`;
  return 'pmany';
};

export default function Videomeet() {
  const server_url = server;

  const connections = useRef({});
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoRef = useRef();
  const iceCandidateQueue = useRef({});
  const messageRef = useRef("");

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);
  const [showModel, setShowModel] = useState(true);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessages, setNewMessages] = useState(0);

  const peerConfigConnections = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  };

  const audioSilence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  const blackScreen = (width = 640, height = 480) => {
    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").fillRect(0, 0, width, height);
    return Object.assign(canvas.captureStream().getVideoTracks()[0], { enabled: false });
  };

  const blacksilence = (...args) => new MediaStream([blackScreen(...args), audioSilence()]);

  // ─── Get camera + mic permissions ───────────
  const getPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setVideoAvailable(true);
      setAudioAvailable(true);
      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);
      window.localStream = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    } catch (err) {
      console.log(err);
      setVideoAvailable(false);
      setAudioAvailable(false);
    }
  };

  useEffect(() => { getPermissions(); }, []);

  const assignLocalStream = (el) => {
    if (el && window.localStream && el.srcObject !== window.localStream) {
      el.srcObject = window.localStream;
    }
  };

  // ─── Toggle camera ───────────────────────────
  const handleVideo = () => {
    if (!window.localStream) return;
    const track = window.localStream.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setVideo(track.enabled); }
  };

  // ─── Toggle mic ──────────────
  const handleAudio = () => {
    if (!window.localStream) return;
    const track = window.localStream.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setAudio(track.enabled); }
  };

  // ─── Screen share ──────────
  const getDisplayMediaSuccess = (stream) => {
    try { window.localStream.getTracks().forEach(t => t.stop()); } catch (e) { console.log(e); }
    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    const reoffer = () => {
      for (let id in connections.current) {
        if (id === socketIdRef.current) continue;
        connections.current[id].addStream(window.localStream);
        connections.current[id].createOffer().then(desc => {
          connections.current[id].setLocalDescription(desc).then(() => {
            socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections.current[id].localDescription }));
          });
        });
      }
    };
    reoffer();

    stream.getTracks().forEach(track => {
      track.onended = () => {
        setScreen(false);
        try { window.localStream.getTracks().forEach(t => t.stop()); } catch (e) { console.log(e); }
        window.localStream = blacksilence();
        localVideoRef.current.srcObject = window.localStream;
        reoffer();
      };
    });
  };

  const getDisplayMedia = () => {
    if (screen && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        .then(getDisplayMediaSuccess)
        .catch(e => console.log(e));
    }
  };

  useEffect(() => { if (screen !== undefined) getDisplayMedia(); }, [screen]);

  // ─── Handle WebRTC signalling ─────────────────
  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);
    if (fromId === socketIdRef.current) return;
    const pc = connections.current[fromId];
    if (!pc) return;

    if (signal.sdp) {
      pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => {
          if (signal.sdp.type === "offer") {
            pc.createAnswer().then(desc => {
              pc.setLocalDescription(desc).then(() => {
                socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: pc.localDescription }));
              });
            });
          }
          (iceCandidateQueue.current[fromId] || []).forEach(c => {
            pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.log);
          });
          iceCandidateQueue.current[fromId] = [];
        })
        .catch(console.log);
    }

    if (signal.ice) {
      if (pc.remoteDescription) {
        pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(console.log);
      } else {
        if (!iceCandidateQueue.current[fromId]) iceCandidateQueue.current[fromId] = [];
        iceCandidateQueue.current[fromId].push(signal.ice);
      }
    }
  };

  // ─── Chat ──────────
  const addMessage = (sender, data, socketIdSender) => {
    setMessages(prev => [...prev, { sender, data, socketIdSender }]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages(prev => (prev || 0) + 1);
    }
  };

  const sendMessage = () => {
    if (!messageRef.current) return;
    socketRef.current.emit("chat-message", messageRef.current, username);
    messageRef.current = "";
  };

  // ─── Socket + WebRTC setup ──────
  const connectToSocketServer = () => {
    socketRef.current = io(server_url);
    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit("please-join", window.location.href);
      socketRef.current.on("chat-message", addMessage);

      // ── User left: clean up properly ─────
      socketRef.current.on("user-left", (id) => {
        if (connections.current[id]) {
          connections.current[id].close();
          delete connections.current[id];
        }
        delete iceCandidateQueue.current[id];
        setVideos(prev => prev.filter(v => v.socketId !== id));
      });

      // ─New user joined──
      socketRef.current.on("joined-user", (id, clients) => {
        clients.forEach(socketListId => {
          //  Skip if peer connection already exists (prevents duplicate streams)
          if (connections.current[socketListId]) return;

          const pc = new RTCPeerConnection(peerConfigConnections);
          connections.current[socketListId] = pc;

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socketRef.current.emit("signal", socketListId, JSON.stringify({ ice: event.candidate }));
            }
          };

          // ontrack: update stream if socketId exists, otherwise add new entry
          pc.ontrack = (event) => {
            const stream = event.streams[0];
            setVideos(prev => {
              const exists = prev.find(v => v.socketId === socketListId);
              if (exists) {
                return prev.map(v => v.socketId === socketListId ? { ...v, stream } : v);
              }
              return [...prev, { socketId: socketListId, stream }];
            });
          };

          // Add local stream tracks
          if (window.localStream) {
            window.localStream.getTracks().forEach(track => {
              pc.addTrack(track, window.localStream);
            });
          } else {
            window.localStream = blacksilence();
            window.localStream.getTracks().forEach(track => {
              pc.addTrack(track, window.localStream);
            });
          }
        });

        // Create offer only for our own join event
        if (id === socketIdRef.current) {
          Object.entries(connections.current).forEach(([id2, pc]) => {
            if (id2 === socketIdRef.current) return;
            pc.createOffer().then(desc => {
              pc.setLocalDescription(desc).then(() => {
                socketRef.current.emit("signal", id2, JSON.stringify({ sdp: pc.localDescription }));
              });
            });
          });
        }
      });
    });
  };

  const handleScreen = () => setScreen(!screen);

  const routeTo = useNavigate();

  const handleEndCall = () => {
    if (window.localStream) window.localStream.getTracks().forEach(t => t.stop());
    Object.values(connections.current).forEach(pc => pc.close());
    if (socketRef.current) socketRef.current.disconnect();
    setAskForUsername(true);
    setVideos([]);
    routeTo("/Home");
  };

  const connect = () => {
    setAskForUsername(false);
    if (window.localStream) {
      const vTrack = window.localStream.getVideoTracks()[0];
      const aTrack = window.localStream.getAudioTracks()[0];
      if (vTrack) { vTrack.enabled = true; setVideo(true); }
      if (aTrack) { aTrack.enabled = true; setAudio(true); }
    }
    setTimeout(() => {
      if (localVideoRef.current && window.localStream) {
        localVideoRef.current.srcObject = window.localStream;
      }
    }, 100);
    connectToSocketServer();
  };

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      Object.values(connections.current).forEach(pc => pc.close());
      if (window.localStream) window.localStream.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div>
      {askForUsername ? (
       
        <div className="lobbyContainer">
          <h2>Enter into Lobby</h2>
          <TextField
  label="Username"
  variant="outlined"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  onKeyDown={(e) => e.key === 'Enter' && connect()}
  sx={{
    input: { color: "white" }, 
    label: { color: "white" }, 

    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: "white", 
      },
      "&:hover fieldset": {
        borderColor: "white", 
      },
      "&.Mui-focused fieldset": {
        borderColor: "white",
      },
    },

    "& .MuiInputLabel-root.Mui-focused": {
      color: "white", 
    },
  }}
/>
          <Button variant="contained" onClick={connect}>Join</Button>
          <video
            ref={(el) => { localVideoRef.current = el; assignLocalStream(el); }}
            autoPlay
            muted
            playsInline
          />
        </div>
      ) : (
      
        <div className='vcontainer'>

          {/* ── Chat Panel ── */}
          {showModel && (
            <div className="chatSection">
              <div className="receiveChat">
                <h1>openRoom Chat</h1>
                <hr />
                <div className="chattingDisplay">
                  {messages.map((item, index) => (
                    <div key={index}>
                      <h2>{item.sender}</h2>
                      <p>{item.data}</p>
                    </div>
                  ))}
                </div>
                <div className="sendChat">
                  <div className='textareacontainer'>
                    <Box sx={{ width: '100%', position: 'relative' }}>
                      <div className="iconSend">
                        <IconButton onClick={sendMessage}>
                          <SendIcon />
                        </IconButton>
                      </div>
                      <TextField
                        fullWidth
                        label="enter here..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '999px',
                            paddingRight: '50px'
                          }
                        }}
                        onChange={(e) => { messageRef.current = e.target.value; }}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      />
                    </Box>
                  </div>
                </div>
              </div>
            </div>
          )}

        
          <div className="buttonContainer">
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>

            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable && (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton>
            )}

            <Badge badgeContent={newMessages} max={999} color='secondary'>
              <IconButton
                onClick={() => { setShowModel(!showModel); setNewMessages(0); }}
                style={{ color: "white" }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          
          <video
            className='yourVideo'
            ref={(el) => { localVideoRef.current = el; assignLocalStream(el); }}
            autoPlay
            muted
            playsInline
          />

          {/* ── Remote Videos Grid ──
              getGridClass() adds p1/p2/p3... class to drive CSS grid layout
          ── */}
          <div className={`userConferenceVideo ${getGridClass(videos.length)}`}>
            {videos.map(v => (
              <RemoteVideo key={v.socketId} socketId={v.socketId} stream={v.stream} />
            ))}
          </div>

        </div>
      )}
    </div>
  );
}