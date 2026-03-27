import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { 
  Container, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  FormControl, InputLabel, Select, MenuItem, Box, Chip
} from '@mui/material';
import { CalendarMonth } from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ScheduleDefense = () => {
  const { token } = useSelector((state) => state.auth);
  const [phase, setPhase] = useState('midterm');
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

// ... inside component

const generateSchedule = async () => {
  setLoading(true);
  try {
    const res = await axios.post('http://localhost:5000/api/schedules/batch', 
      { phase }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setSchedule(res.data);
    
    // UI Feedback for empty result
    if (res.data.length === 0) {
      alert(`No eligible projects found for ${phase} phase. Ensure projects are approved/endorsed.`);
    }
  } catch (err) { 
    alert("Error generating schedule"); 
  }
  setLoading(false);
};

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`FYP Defense Schedule - ${phase.toUpperCase()}`, 14, 20);
    
    autoTable(doc, {
      startY: 30,
      head: [['Time', 'Student', 'Project', 'Room', 'Panel']],
      body: schedule.map(s => [
        new Date(s.date).toLocaleString(),
        s.studentName,
        s.projectTitle,
        s.room,
        s.panel.join(', ')
      ]),
    });
    doc.save('schedule.pdf');
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h4" fontWeight="bold" color="primary">Auto-Scheduler</Typography>
        {schedule.length > 0 && (
           <Button variant="contained" color="secondary" onClick={downloadPDF}>Download Timetable PDF</Button>
        )}
      </Box>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Defense Phase</InputLabel>
            <Select value={phase} onChange={(e) => setPhase(e.target.value)}>
              <MenuItem value="midterm">Midterm Evaluation</MenuItem>
              <MenuItem value="final">Final Viva</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            size="large" 
            startIcon={<CalendarMonth />} 
            onClick={generateSchedule}
            disabled={loading}
          >
            {loading ? "Calculating Slots..." : "Generate Schedule"}
          </Button>
        </Box>
      </Paper>

      {schedule.length > 0 && (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#0a192f' }}>
              <TableRow>
                <TableCell sx={{ color: 'white' }}>Date & Time</TableCell>
                <TableCell sx={{ color: 'white' }}>Room</TableCell>
                <TableCell sx={{ color: 'white' }}>Project</TableCell>
                <TableCell sx={{ color: 'white' }}>Student</TableCell>
                <TableCell sx={{ color: 'white' }}>Panelists</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedule.map((slot, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Typography fontWeight="bold">
                      {new Date(slot.date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="primary">
                      {new Date(slot.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Typography>
                  </TableCell>
                  <TableCell><Chip label={slot.room} size="small" /></TableCell>
                  <TableCell>{slot.projectTitle}</TableCell>
                  <TableCell>{slot.studentName}</TableCell>
                  <TableCell>
                    {slot.panel.map(p => <div key={p}>• {p}</div>)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
};

export default ScheduleDefense;