import { Server } from "socket.io";

let connections = {};//who's in which room
let messages = {};//chat history
let timeOnline = {};//when each user joined

export const ConnectWithServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",//access all type of origin
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log(" User connected:", socket.id);

    socket.on("please-join", (path) => {//Adds user to a room, tells everyone else they joined
      if (!connections[path]) {
        connections[path] = [];
      }

      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      connections[path].forEach((id) => {
        io.to(id).emit("joined-user", socket.id, connections[path]);
      });
    });

    socket.on("signal", (toId, message) => {//Forwards WebRTC handshake data between two users
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {//Finds which room the sender is in, saves & broadcasts the message
      let roomKey = null;

      for (let key in connections) {
        if (connections[key].includes(socket.id)) {
          roomKey = key;
          break;
        }
      }

      if (roomKey) {
        if (!messages[roomKey]) {
          messages[roomKey] = [];
        }

        messages[roomKey].push({
          sender,
          data,
          socketIdSender: socket.id
        });

        connections[roomKey].forEach((id) => {
          io.to(id).emit("chat-message", sender, data, socket.id);
        });
      }
    });

    socket.on("disconnect", () => {//Removes user from room, notifies others, cleans up empty rooms
      console.log(" Disconnected:", socket.id);

      for (let key in connections) {
        if (connections[key].includes(socket.id)) {
          connections[key] = connections[key].filter(
            (id) => id !== socket.id
          );

          connections[key].forEach((id) => {
            io.to(id).emit("user-left", socket.id);
          });

          if (connections[key].length === 0) {
            delete connections[key];
          }

          break;
        }
      }

      delete timeOnline[socket.id];
    });
  });

  return io;
};