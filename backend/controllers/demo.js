// import  {Server, Socket} from "socket.io";
// let connections={}
// let messages={}
// let timeOnline={}

// export const ConnectWithServer=(server)=>{
// const io= new Server(server,{
//     cors:{
// origin:"*",
// methods:["get","post"],
// allowedHeaders:["*"],
// credentials:true
//     }
// });
// io.on("connection",(socket)=>{//connect with socket 
//     console.log("vfhbjdn")
//     socket.on("please-join",(path)=>{     //on socket and listen path for joining client 
//         if(connections[path]==undefined){
//             connections[path]=[];
//         }
//         connections[path].push(socket.id);//if multiple user use my webside so,can create multiple meeting code so,when diffre-diffre user enter to the webside by the meeting code there we access the path with meeting code but there will be  multiple user with same meeting code so,we need to push the id 
//         timeOnline[socket.id]=new Date();//show the time of online
//         connections[path].forEach(element => {     //we have index and element so we put the first id with path then next and so on
//             io.to(element).emit("joined-user",socket.id,connections[path])//it gives the socket id and path to the joined user
//         }); 
//         if(messages[path]!==undefined){//same thing is here when send initial message give the
//             for(let i=0;i<messages[path].length;i++){    
//          io.to(socket.id).emit("real-message",messages[path][i]["sender"],
//                     messages[path][i]["data"],messages[path][i]["socket-id-sender"]
//                 )
//             }
//         }
    
//     })
//     socket.on("signal",(toId,message)=>{ //on socket catch message and id of client
// io.to(toId).emit("signal",socket.id,message);
//     })
//     socket.on("chat-message",(data,sender)=>{//catch by the server and then server serve   the data(in form of message)
//         const [matchingroom,found]=Object.entries(connections)
//         .reduce(([room,isFound],[roomKey,roomValue])=>{
// if(!isFound && roomValue.includes(socket.id)){
//     return [roomKey,true]
// } 
// return [room,isFound];
//         },[" ",false])

//         if(found==true){
//             if(messages[matchingroom]==undefined){
//                 messages[matchingroom]=[]
//             }
//             messages[matchingroom].push({
//                 sender: sender,
//                 data: data,
//                 socketIdSender: socket.id
//               });
//               console.log(data, sender, socket.id);
//               connections[matchingroom].forEach((element) => {
//                 io.to(element).emit("chat-message", sender, data, socket.id);
//               });
//         }
//     })
//     socket.on("disconnect",()=>{//if user disconnection
//  let  distime=Math.abs(timeOnline[socket.id]- new Date())
//  for([k,v] of JSON.parse(JSON.stringify(Object.entries(connections)))){
//     for(let i=0;i<v.length;i++){
//         if(v[a]==socket.id){
// key=k

// for(let i=0;i<connections[key].length;i++){
//     io.to(connections[key][i].emit("user-left",socket.id))
// }
// let index=connections[key].indexOf(socket.id)
// connections[key].splice(index,1)

// if(connections[key]==0){
//     delete connections[key]
// }
//         }
//     }
//  }
//     })
// })
// return io;
// }

