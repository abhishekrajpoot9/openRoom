
import { useContext, useEffect, useState } from "react";
import { Authcontext } from "../context/handleauth";
import { useNavigate } from "react-router-dom";
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { IconButton } from "@mui/material";
import { FaDiceFive } from "react-icons/fa";
const History = () => {
    const {getHistoryOfUser}=useContext(Authcontext);
    const[meetings,setMeetings]=useState([]);
    const routeTo=useNavigate();

    useEffect(()=>{
        const fetchHistory=async()=>{
            try {
              const history = await getHistoryOfUser();
setMeetings(Array.isArray(history) ? history : []);
            } catch (error) {
              console.log(error);
            }
        }
        fetchHistory();
    },[getHistoryOfUser])
    let formatDate=(dateString)=>{
      const date=new Date(dateString)
      const day= date.getDate().toString().padStart(2,"0");
      const month=(date.getMonth()+1).toString().padStart(2,"0");
      const year=date.getFullYear();
      return `${day}/${month}/${year}`
    }
    return (
        <div>
          <IconButton style={{color:"white"}} onClick={() => routeTo("/home")}>
            <HomeIcon />
          </IconButton>
      
          { meetings.length === 0 ? (
            <Typography>No meeting history found.</Typography>
          ) : (
            meetings.map((e, i) => (
              <Card key={i} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                    Meeting Code: {e.meetingCode}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>
                    Date: {formatDate(e.date)}
                  </Typography>
                </CardContent>
              </Card>
              )

            )
          )}
        </div>
      );
}
 
export default History