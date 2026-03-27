import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, 
  Chip, IconButton, Box, Container, Tabs, Tab, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Card, CardContent, List, ListItem, ListItemText, Divider, Avatar 
} from '@mui/material';
import { 
  CheckCircle as ApproveIcon, 
  School as GradeIcon, 
  Visibility as ViewIcon, 
  Block as BlockIcon,
  Cancel as RejectIcon,
  History as HistoryIcon,
  Description as FileIcon,
  Gavel as GavelIcon,
  Download as DownloadIcon,
  Folder as FolderIcon
} from '@mui/icons-material';

const PanelistDashboard = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // Data States
  const [projects, setProjects] = useState([]);
  const [resources, setResources] = useState([]); 
  const [eligibilityData, setEligibilityData] = useState({});
  
  // UI States
  const [tabValue, setTabValue] = useState(0); 
  const [openGrade, setOpenGrade] = useState(false);
  const [gradeData, setGradeData] = useState({ pid: '', phase: '', marks: '' });

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = async () => {
    try {
      // 1. Fetch Projects
      const res = await axios.get('http://localhost:5000/api/projects', config);
      setProjects(res.data);

      // 2. Fetch Resources (Templates/Rubrics)
      const resRes = await axios.get('http://localhost:5000/api/resources', config);
      setResources(resRes.data);

      // 3. Fetch Eligibility (Log Counts)
      res.data.forEach(async (p) => {
        if(p.status !== 'registered') {
           try {
             const eRes = await axios.get(`http://localhost:5000/api/projects/${p._id}/eligibility`, config);
             setEligibilityData(prev => ({...prev, [p._id]: eRes.data}));
           } catch (e) {}
        }
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (token) fetchData(); }, [token, fetchData]);

  // --- ACTIONS ---

  const handleApproveProposal = async (id) => {
    if(!window.confirm("Accept Proposal?")) return;
    try { 
      await axios.put(`http://localhost:5000/api/projects/${id}/approve-proposal`, {}, config); 
      fetchData(); 
    } catch (err) { alert("Failed"); }
  };

  const handleRejectProposal = async (id) => {
    if(!window.confirm("Reject Proposal and ask for Revision?")) return;
    try { 
      await axios.put(`http://localhost:5000/api/projects/${id}/reject-proposal`, {}, config); 
      fetchData(); 
      alert("Proposal Rejected.");
    } catch (err) { alert("Failed to reject"); }
  };

  const handleInitiateEvaluation = (project, phase, logCount) => {
    // 1. Check Log Counts
    if (phase === 'midterm' && logCount < 12) return alert(`Eligibility Failed: Student has only ${logCount}/12 approved logs.`);
    if (phase === 'final' && logCount < 24) return alert(`Eligibility Failed: Student has only ${logCount}/24 approved logs.`);

    // 2. Check File Uploads
    if (phase === 'midterm' && !project.hasMidtermPresentation) return alert("Student has NOT uploaded the Midterm Presentation.");
    if (phase === 'final' && !project.hasFinalReport) return alert("Student has NOT uploaded the Final Report.");
    if (phase === 'final' && project.status !== 'plagiarism_cleared') return alert("Plagiarism Check Pending by Coordinator.");

    // 3. Open Grading Modal
    setGradeData({ pid: project._id, phase, marks: '' });
    setOpenGrade(true);
  };

  const submitGrade = async () => {
    try {
      await axios.put(`http://localhost:5000/api/projects/${gradeData.pid}/grade-phase`, {
        phase: gradeData.phase, marks: Number(gradeData.marks)
      }, config);
      setOpenGrade(false);
      fetchData();
      alert("Grading Complete & Saved!");
    } catch (err) { alert(err.response?.data?.message || "Error"); }
  };

  // --- FILTERS ---
  const getProposals = () => projects.filter(p => p.status === 'supervisor_endorsed');
  const getMidterm = () => projects.filter(p => p.status === 'proposal_approved');
  const getFinal = () => projects.filter(p => p.status === 'plagiarism_cleared');
  
  // HISTORY: All projects that have passed the "Endorsed" stage
  // This includes Approved Proposals, Completed Midterms, Final Submitted, Graduated, Revisions
  const getHistory = () => projects.filter(p => 
    !['registered', 'supervisor_endorsed'].includes(p.status)
  );

  // Helper to find template by phase
  const getTemplateLink = (phase) => {
    const res = resources.find(r => r.phase === phase);
    return res ? res.fileUrl : null;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      
      {/* HERO HEADER */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, mb: 4, borderRadius: 4, color: 'white',
          background: 'linear-gradient(135deg, #2E3B55 0%, #1a237e 100%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="800">Committee Console</Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
            Evaluate Proposals, Midterms, and Final Vivas.
          </Typography>
        </Box>
        <GavelIcon sx={{ fontSize: 60, opacity: 0.2 }} />
      </Paper>

      <Grid container spacing={4}>
        
        {/* LEFT COLUMN: Main Evaluation Area */}
        <Grid item xs={12} lg={9}>
          <Paper sx={{ mb: 3, borderRadius: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, v) => setTabValue(v)} 
              textColor="primary" 
              indicatorColor="primary"
              variant="scrollable"
            >
              <Tab label="1. Proposal Defense" icon={<FileIcon/>} iconPosition="start" />
              <Tab label="2. Midterm Evaluation" icon={<GradeIcon/>} iconPosition="start" />
              <Tab label="3. Final Viva" icon={<GavelIcon/>} iconPosition="start" />
              <Tab label="Previous Records" icon={<HistoryIcon/>} iconPosition="start" />
            </Tabs>
          </Paper>

          <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, p: 0 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Student</strong></TableCell>
                  <TableCell><strong>Project Title</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  {/* Show Marks Column only for History Tab */}
                  {tabValue === 3 && <TableCell><strong>Score History</strong></TableCell>}
                  <TableCell align="right"><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(tabValue === 0 ? getProposals() : tabValue === 1 ? getMidterm() : tabValue === 2 ? getFinal() : getHistory()).map((project) => {
                    const eligibility = eligibilityData[project._id] || { approvedLogs: 0 };
                    const logCount = eligibility.approvedLogs;
                    
                    const fileReady = tabValue === 1 ? project.hasMidtermPresentation : project.hasFinalReport;
                    const fileLabel = tabValue === 1 ? "Presentation" : "Final Report";
                    const reqLogs = tabValue === 1 ? 12 : 24;
                    const logsReady = logCount >= reqLogs;

                    return (
                      <TableRow key={project._id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ width: 30, height: 30, fontSize: 14 }}>{project.studentId?.profile?.fullName?.charAt(0)}</Avatar>
                            {project.studentId?.profile?.fullName}
                          </Box>
                        </TableCell>
                        <TableCell>{project.title}</TableCell>
                        
                        {/* Status / Requirement Column */}
                        <TableCell>
                          {tabValue === 3 ? (
                             // HISTORY VIEW: Show generic status chip
                             <Chip 
                               label={project.status.replace(/_/g, ' ').toUpperCase()} 
                               size="small" 
                               color={project.status === 'graduated' ? 'success' : 'default'} 
                               variant={project.status === 'graduated' ? 'filled' : 'outlined'}
                             />
                          ) : tabValue > 0 ? (
                             // ACTIVE EVALUATION VIEW: Show Requirements
                             <Box display="flex" gap={1}>
                               <Chip label={`${logCount}/${reqLogs} Logs`} size="small" color={logsReady ? "success" : "warning"} variant={logsReady ? "filled" : "outlined"}/>
                               <Chip label={fileReady ? `${fileLabel} Ready` : `${fileLabel} Missing`} color={fileReady ? "success" : "error"} variant={fileReady ? "filled" : "outlined"} size="small"/>
                             </Box>
                          ) : (
                             // PROPOSAL VIEW
                             <Chip label="Proposal Ready" size="small" color="info" variant="outlined"/>
                          )}
                        </TableCell>

                        {/* HISTORY: Score Column */}
                        {tabValue === 3 && (
                          <TableCell>
                            <Box sx={{ display:'flex', gap:1 }}>
                              {project.marks?.midterm > 0 && <Chip label={`Mid: ${project.marks.midterm}`} size="small" color="secondary" variant="outlined" />}
                              {project.marks?.finalViva > 0 && <Chip label={`Final: ${project.marks.finalViva}`} size="small" color="success" variant="outlined" />}
                              {!project.marks?.midterm && !project.marks?.finalViva && <Typography variant="caption">-</Typography>}
                            </Box>
                          </TableCell>
                        )}

                        {/* Actions Column */}
                        <TableCell align="right">
                          <Box display="flex" justifyContent="flex-end" gap={1}>
                            
                            {/* TAB 0: PROPOSAL ACTIONS */}
                            {tabValue === 0 && (
                              <>
                                <Button variant="contained" color="success" size="small" onClick={() => handleApproveProposal(project._id)} startIcon={<ApproveIcon />}>Approve</Button>
                                <Button variant="outlined" color="error" size="small" onClick={() => handleRejectProposal(project._id)} startIcon={<RejectIcon />}>Reject</Button>
                              </>
                            )}

                            {/* TAB 1 & 2: EVALUATION ACTIONS */}
                            {(tabValue === 1 || tabValue === 2) && (
                              <Button 
                                variant="contained" 
                                size="small" 
                                color={tabValue === 1 ? "secondary" : "primary"}
                                startIcon={fileReady && logsReady ? <GradeIcon /> : <BlockIcon />}
                                disabled={!fileReady || !logsReady} 
                                onClick={() => handleInitiateEvaluation(project, tabValue === 1 ? 'midterm' : 'final', logCount)}
                              >
                                {fileReady && logsReady ? "Evaluate" : "Locked"}
                              </Button>
                            )}
                            
                            {/* ALL TABS: View Details */}
                            <IconButton size="small" onClick={() => navigate(`/projects/${project._id}`)} title="View Project Hub">
                              <ViewIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                })}
                
                {/* Empty States */}
                {((tabValue === 0 && getProposals().length === 0) || 
                  (tabValue === 1 && getMidterm().length === 0) || 
                  (tabValue === 2 && getFinal().length === 0)) && 
                  <TableRow><TableCell colSpan={5} align="center" sx={{py:6, color: 'text.secondary'}}>No pending tasks in this category.</TableCell></TableRow>}
                
                {tabValue === 3 && getHistory().length === 0 && 
                  <TableRow><TableCell colSpan={5} align="center" sx={{py:6, color: 'text.secondary'}}>No history available yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* RIGHT COLUMN: Resources / Sidebar */}
        <Grid item xs={12} lg={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <FolderIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Evaluation Rubrics</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="textSecondary" mb={2}>
                Download the official criteria templates uploaded by the Coordinator.
              </Typography>
              
              <List dense>
                <ListItem 
                  disableGutters 
                  secondaryAction={
                    <IconButton edge="end" color="primary" disabled={!getTemplateLink('proposal')} href={getTemplateLink('proposal')} target="_blank">
                      <DownloadIcon />
                    </IconButton>
                  }
                >
                  <ListItemText primary="Proposal Rubric" secondary={getTemplateLink('proposal') ? "Available" : "Not uploaded"} />
                </ListItem>
                <Divider component="li" />
                <ListItem 
                  disableGutters
                  secondaryAction={
                    <IconButton edge="end" color="secondary" disabled={!getTemplateLink('midterm')} href={getTemplateLink('midterm')} target="_blank">
                      <DownloadIcon />
                    </IconButton>
                  }
                >
                  <ListItemText primary="Midterm Rubric" secondary={getTemplateLink('midterm') ? "Available" : "Not uploaded"} />
                </ListItem>
                <Divider component="li" />
                <ListItem 
                  disableGutters
                  secondaryAction={
                    <IconButton edge="end" color="success" disabled={!getTemplateLink('final')} href={getTemplateLink('final')} target="_blank">
                      <DownloadIcon />
                    </IconButton>
                  }
                >
                  <ListItemText primary="Final Viva Rubric" secondary={getTemplateLink('final') ? "Available" : "Not uploaded"} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Grading Modal */}
      <Dialog open={openGrade} onClose={() => setOpenGrade(false)}>
         <DialogTitle>Enter Marks ({gradeData.phase === 'midterm' ? "Max 30" : "Max 40"})</DialogTitle>
         <DialogContent sx={{ width: 350 }}>
           <Typography variant="body2" sx={{mb:2}}>Ensure you have reviewed the presentation/report.</Typography>
           <TextField autoFocus label="Marks Obtained" type="number" fullWidth value={gradeData.marks} onChange={(e) => setGradeData({...gradeData, marks: e.target.value})} />
         </DialogContent>
         <DialogActions><Button onClick={() => setOpenGrade(false)}>Cancel</Button><Button onClick={submitGrade} variant="contained">Submit Score</Button></DialogActions>
       </Dialog>
    </Container>
  );
};
export default PanelistDashboard;