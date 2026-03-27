import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, 
  Chip, IconButton, Tooltip, Box, Avatar, Container, LinearProgress, Grid,
  List, ListItem, ListItemText, Divider 
} from '@mui/material';
import { 
  CheckCircle as EndorseIcon, 
  Cancel as RejectIcon, 
  Assignment as LogIcon,
  Campaign as AnnounceIcon 
} from '@mui/icons-material';

const SupervisorDashboard = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Projects
      try {
        const res = await axios.get('http://localhost:5000/api/projects', config);
        setProjects(res.data);
      } catch (err) { console.error("Error fetching projects:", err); }

      // 2. Fetch Announcements
      try {
        const annRes = await axios.get('http://localhost:5000/api/dashboard/announcements', config);
        setAnnouncements(annRes.data);
      } catch (err) { console.error("Error fetching announcements:", err); }
    };

    if (token) fetchData();
  }, [token, config]);

  // --- ACTIONS ---
  
  const handleEndorse = async (projectId) => {
    if(!window.confirm("Endorse this proposal for Committee Review?")) return;
    try {
      await axios.put(`http://localhost:5000/api/projects/${projectId}/endorse`, {}, config);
      window.location.reload();
    } catch (err) { alert("Endorsement failed"); }
  };

  const handleReject = async (projectId) => {
    const reason = prompt("Enter reason for revision:");
    if (!reason) return;
    try {
      await axios.put(`http://localhost:5000/api/projects/${projectId}/status`, 
        { status: 'revision_required', feedback: reason }, config
      );
      window.location.reload();
    } catch (err) { alert("Update failed"); }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Supervisor Console
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Endorse proposals and evaluate weekly progress logs inside the Project Hub.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        
        {/* LEFT COLUMN: PROJECTS TABLE */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, boxShadow: 3 }}>
            <Box p={2} bgcolor="#f5f5f5">
              <Typography variant="h6" fontWeight="bold">Assigned Projects</Typography>
            </Box>
            <Table>
              <TableHead sx={{ bgcolor: 'white' }}>
                <TableRow>
                  <TableCell><strong>Project Title</strong></TableCell>
                  <TableCell><strong>Student</strong></TableCell>
                  <TableCell><strong>Phase Status</strong></TableCell>
                  <TableCell><strong>Progress</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">{project.title}</Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: 12 }}>
                          {project.studentId?.profile?.fullName?.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">{project.studentId?.profile?.fullName}</Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={project.status.replace(/_/g, ' ').toUpperCase()} 
                        color={
                          project.status === 'registered' ? 'warning' :
                          project.status === 'proposal_approved' ? 'success' : 'default'
                        } 
                        size="small" 
                        variant={project.status === 'supervisor_endorsed' ? 'outlined' : 'filled'}
                      />
                    </TableCell>

                    <TableCell sx={{ width: 150 }}>
                       {project.status === 'proposal_approved' || project.status === 'midterm_completed' ? (
                         <Box>
                            <Typography variant="caption" display="block">Log Score</Typography>
                            <LinearProgress variant="determinate" value={Math.min(((project.marks?.supervisorLogs || 0)/30)*100, 100)} sx={{ height: 6, borderRadius: 5 }} />
                         </Box>
                       ) : (
                         <Typography variant="caption" color="text.secondary">Pre-Development</Typography>
                       )}
                    </TableCell>
                    
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        
                        {/* BUTTON SET 1: ENDORSE/REJECT (Only if Registered) */}
                        {project.status === 'registered' && (
                          <>
                            <Tooltip title="Endorse Proposal">
                              <IconButton color="success" onClick={() => handleEndorse(project._id)}>
                                <EndorseIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Request Revision">
                              <IconButton color="error" onClick={() => handleReject(project._id)}>
                                <RejectIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}

                        {/* BUTTON 2: VIEW HUB (For Grading Logs) */}
                        <Button 
                          size="small" 
                          variant="outlined" 
                          startIcon={<LogIcon />}
                          onClick={() => navigate(`/projects/${project._id}`)}
                        >
                          Project Hub
                        </Button>

                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {projects.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>No projects assigned.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* RIGHT COLUMN: NOTICE BOARD */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ borderRadius: 3, height: '100%', maxHeight: 600, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box p={2} bgcolor="#e3f2fd" display="flex" alignItems="center" gap={1}>
              <AnnounceIcon color="primary" />
              <Typography variant="h6" color="primary" fontWeight="bold">Notice Board</Typography>
            </Box>
            <List sx={{ overflow: 'auto', flex: 1 }}>
              {announcements.length > 0 ? announcements.map((ann) => (
                <React.Fragment key={ann._id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText 
                      primary={<Typography variant="subtitle2" fontWeight="bold">{ann.title}</Typography>}
                      secondary={
                        <>
                          <Typography variant="caption" display="block" color="textSecondary">
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </Typography>
                          {ann.content}
                        </>
                      } 
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              )) : (
                <Box p={4} textAlign="center">
                  <Typography variant="body2" color="textSecondary">No new announcements.</Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>

      </Grid>
    </Container>
  );
};

export default SupervisorDashboard;