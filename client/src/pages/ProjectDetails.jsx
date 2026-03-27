import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Box, Typography, Paper, Grid, Chip, Button, Divider, List, ListItem, 
  ListItemText, ListItemAvatar, Avatar, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, MenuItem, Container, IconButton, Tabs, Tab, 
  Table, TableBody, TableCell, TableHead, TableRow, Alert 
} from '@mui/material';
import { 
  Description as FileIcon, CloudUpload as UploadIcon, ArrowBack as ArrowBackIcon,
  PersonAdd as AddMemberIcon, Check as ApproveIcon, Close as RejectIcon,
  AttachFile as AttachIcon, AssignmentLate as MandatoryIcon, Grade as GradeIcon,
  Delete as DeleteIcon, Send as SendIcon, Folder as FolderIcon, Download as DownloadIcon
} from '@mui/icons-material';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);
  
  // --- STATE MANAGEMENT ---
  const [project, setProject] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [resources, setResources] = useState([]); // For Sidebar Templates
  const [tabValue, setTabValue] = useState(0); 

  // Modals
  const [openUpload, setOpenUpload] = useState(false);
  const [openFeedback, setOpenFeedback] = useState(false);
  const [openAddMember, setOpenAddMember] = useState(false);
  const [openLogModal, setOpenLogModal] = useState(false);
  const [openApproveLog, setOpenApproveLog] = useState(false);

  // Form Data
  const [uploadData, setUploadData] = useState({ title: '', type: 'report' });
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Feedback & Grading Data
  const [feedbackText, setFeedbackText] = useState('');
  const [submissionGrade, setSubmissionGrade] = useState(''); 
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  
  // Team Member Data
  const [newMemberEmail, setNewMemberEmail] = useState('');
  
  // Log Entry Data
  const [logData, setLogData] = useState({ 
    logNumber: 1, weekStartDate: '', activity: '', hoursSpent: '' 
  });
  const [logFile, setLogFile] = useState(null);
  const [currentLogId, setCurrentLogId] = useState(null);
  const [logScore, setLogScore] = useState('');

  const config = { headers: { Authorization: `Bearer ${token}` } };

  // --- DATA FETCHING ---
  const fetchData = async () => {
    try {
      // 1. Project Info
      const projRes = await axios.get('http://localhost:5000/api/projects', config);
      const foundProject = projRes.data.find(p => p._id === id);
      setProject(foundProject);

      // 2. Submissions
      const subRes = await axios.get(`http://localhost:5000/api/submissions/${id}`, config);
      setSubmissions(subRes.data);

      // 3. Logs
      try {
        const logRes = await axios.get(`http://localhost:5000/api/logs/${id}`, config);
        setLogs(logRes.data);
      } catch (e) { console.log("Logs not fetched (likely empty)"); }

      // 4. Resources (Templates)
      try {
        const resRes = await axios.get('http://localhost:5000/api/dashboard/templates', config);
        setResources(resRes.data);
      } catch (e) { }

    } catch (err) { console.error("Error fetching project details:", err); }
  };

  useEffect(() => { if(token) fetchData(); }, [id, token, fetchData]);

  // --- NAVIGATION HANDLER ---
  const handleBack = () => {
    if (user.role === 'student') navigate('/student-dashboard');
    else if (user.role === 'supervisor') navigate('/supervisor-dashboard');
    else if (user.role === 'coordinator') navigate('/coordinator-dashboard');
    else if (user.role === 'panelist') navigate('/panelist-dashboard');
    else navigate('/');
  };

  // --- ACTION HANDLERS ---

  // 1. Submit Final Project
  const handleSubmitFinal = async () => {
    if(!window.confirm("Are you sure? This will submit your project for Plagiarism Checking.")) return;
    try {
      await axios.put(`http://localhost:5000/api/projects/${id}/submit-final`, {}, config);
      fetchData();
      alert("Project Submitted Successfully!");
    } catch (err) { alert(err.response?.data?.message || "Error submitting project"); }
  };

  // 2. Upload File
  const handleOpenUpload = (type = 'report', title = '') => {
    setUploadData({ title, type });
    setOpenUpload(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Please select a file");
    const formData = new FormData();
    formData.append('projectId', id);
    formData.append('title', uploadData.title);
    formData.append('type', uploadData.type);
    formData.append('file', selectedFile);

    try {
      await axios.post('http://localhost:5000/api/submissions', formData, {
        headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
      });
      setOpenUpload(false);
      setSelectedFile(null);
      fetchData();
      alert("Document Uploaded!");
    } catch (err) { alert("Upload failed"); }
  };

  // 3. Add Team Member
  const handleAddMember = async () => {
    try {
      await axios.put(`http://localhost:5000/api/projects/${id}/add-member`, { email: newMemberEmail }, config);
      setOpenAddMember(false);
      setNewMemberEmail('');
      fetchData();
      alert("Member Added!");
    } catch (err) { alert(err.response?.data?.message || "Failed to add member"); }
  };

  // 4. Submit Log
  const handleLogSubmit = async () => {
    if (logs.length >= 24) return alert("Log limit (24) reached."); // Constraint check

    const formData = new FormData();
    formData.append('projectId', id);
    formData.append('logNumber', logData.logNumber);
    formData.append('weekStartDate', logData.weekStartDate);
    formData.append('activity', logData.activity);
    formData.append('hoursSpent', logData.hoursSpent);
    if (logFile) formData.append('file', logFile);

    try {
      await axios.post('http://localhost:5000/api/logs', formData, {
        headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
      });
      setOpenLogModal(false);
      setLogFile(null);
      fetchData();
      alert("Log Submitted!");
    } catch (err) { alert(err.response?.data?.message || "Error submitting log"); }
  };

  // 5. Supervisor: Approve Log
  const clickApproveLog = (logId) => {
    setCurrentLogId(logId);
    setLogScore('');
    setOpenApproveLog(true);
  };

  const submitLogApproval = async () => {
    const score = Number(logScore);
    if (isNaN(score) || score < 0 || score > 10) return alert("Marks must be between 0 and 10.");
    try {
      await axios.put(`http://localhost:5000/api/logs/${currentLogId}/review`, {
        status: 'approved', feedback: 'Approved', marks: score
      }, config);
      setOpenApproveLog(false);
      fetchData();
      alert("Log Approved & Graded!");
    } catch (err) { alert("Error updating log"); }
  };

  // 6. Supervisor: Reject Log (Delete)
  const handleRejectLog = async (logId) => {
    if(!window.confirm("Reject and Delete this Log entry?")) return;
    try {
      await axios.put(`http://localhost:5000/api/logs/${logId}/review`, { status: 'rejected' }, config);
      fetchData();
    } catch (err) { alert("Error rejecting log"); }
  };

  // 7. Supervisor: Grade Submission
  const handleFeedback = async () => {
    try {
      await axios.put(`http://localhost:5000/api/submissions/${selectedSubmission._id}/feedback`, { 
        feedback: feedbackText,
        grade: Number(submissionGrade)
      }, config);
      setOpenFeedback(false);
      fetchData();
      alert("Feedback Saved!");
    } catch (err) { alert("Error sending feedback"); }
  };

  const handleRejectSubmission = async (subId) => {
    if(!window.confirm("Delete submission?")) return;
    try {
        await axios.put(`http://localhost:5000/api/submissions/${subId}/feedback`, { status: 'rejected' }, config);
        fetchData();
    } catch (e) { alert("Error"); }
  };

  // --- RENDER ---
  if (!project) return <Typography sx={{p:4}}>Loading Project Hub...</Typography>;

  // Constraints Logic
  const approvedLogCount = logs.filter(l => l.status === 'approved').length;
  const canUploadMidterm = project.status === 'proposal_approved' && approvedLogCount >= 12;
  const canUploadFinal = project.status === 'midterm_completed' && approvedLogCount >= 24;
  const readyForFinalSubmit = project.hasFinalReport && project.status === 'midterm_completed';

  return (
    <Container maxWidth="xl">
      {/* HEADER & BACK BUTTON */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2, color: 'text.secondary' }}>
          Back to Dashboard
        </Button>
      </Box>

      {/* MAIN PROJECT CARD */}
      <Paper sx={{ p: 4, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)', boxShadow: 3 }}>
        <Grid container justifyContent="space-between" alignItems="flex-start">
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="overline" color="textSecondary" fontWeight="bold">PROJECT HUB</Typography>
              <Chip size="small" label={project.status.replace(/_/g, ' ')} color="primary" />
            </Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ color: '#0a192f' }}>{project.title}</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>{project.description}</Typography>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
            {user.role === 'student' && (
              <>
                <Box display="flex" gap={1} justifyContent="flex-end" flexWrap="wrap">
                  {/* Compliance (Always available) */}
                  <Button variant="outlined" color="error" size="small" startIcon={<MandatoryIcon />} onClick={() => handleOpenUpload('mandatory_response', 'Compliance Form')}>
                    Compliance
                  </Button>

                  {/* Midterm Upload (Restricted) */}
                  {canUploadMidterm && (
                    <Button variant="contained" size="large" startIcon={<UploadIcon />} onClick={() => handleOpenUpload('presentation', 'Midterm Presentation')}>
                      Upload Midterm
                    </Button>
                  )}
                  
                  {/* Final Upload (Restricted) */}
                  {canUploadFinal && (
                    <Button variant="contained" size="large" startIcon={<UploadIcon />} onClick={() => handleOpenUpload('report', 'Final Report')}>
                      Upload Final Report
                    </Button>
                  )}
                </Box>

                {/* Final Submit Button */}
                {readyForFinalSubmit && (
                  <Alert severity="info" sx={{ mt: 2 }} action={
                    <Button color="primary" variant="contained" size="small" endIcon={<SendIcon />} onClick={handleSubmitFinal}>Submit</Button>
                  }>
                    Final Report detected. Submit?
                  </Alert>
                )}
              </>
            )}
            
            <Chip 
              label={`Logs Score: ${project.marks?.supervisorLogs || 0}/30`} 
              color="success" variant="filled" sx={{fontSize: '1rem', py: 2}} 
            />
          </Grid>
        </Grid>
      </Paper>

      {/* TABS */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} textColor="primary" indicatorColor="primary">
          <Tab label="Overview & Files" sx={{ fontWeight: 'bold' }} />
          <Tab label="24-Log Forms" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      {/* TAB 0: FILES & TEAM */}
      {tabValue === 0 && (
        <Grid container spacing={4}>
          {/* File History */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', minHeight: 400 }}>
              <Box p={3} borderBottom="1px solid #eee"><Typography variant="h6" fontWeight="bold">Submission History</Typography></Box>
              <List sx={{ p: 0 }}>
                {submissions.map((sub) => (
                  <React.Fragment key={sub._id}>
                    <ListItem alignItems="flex-start" sx={{ p: 3, '&:hover': { bgcolor: '#f5f7fa' } }}>
                      <ListItemAvatar><Avatar variant="rounded" sx={{ bgcolor: 'primary.light', color: 'primary.main' }}><FileIcon /></Avatar></ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={2} mb={0.5}>
                             <Typography variant="h6" sx={{ fontSize: '1rem' }}>{sub.title}</Typography>
                             {sub.grade > 0 && <Chip label={`Score: ${sub.grade}`} color="success" size="small" icon={<GradeIcon />} />}
                          </Box>
                        }
                        secondary={
                          <Box>
                             <Box display="flex" gap={2} alignItems="center" mb={1}>
                              <Chip label={sub.type.replace('_', ' ').toUpperCase()} size="small" variant="outlined" color={sub.type === 'mandatory_response' ? 'error' : 'default'} />
                              <a href={sub.fileUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', fontWeight: 600, color: '#1976d2' }}>Download File</a>
                            </Box>
                            {sub.feedback && <Paper variant="outlined" sx={{ p: 2, mt: 1.5, bgcolor: '#fff8e1' }}><Typography variant="body2">{sub.feedback}</Typography></Paper>}
                          </Box>
                        }
                      />
                      {user.role === 'supervisor' && !sub.feedback && (
                        <Box display="flex" gap={1}>
                           <IconButton color="error" title="Reject" onClick={() => handleRejectSubmission(sub._id)}><DeleteIcon /></IconButton>
                           <Button size="small" variant="outlined" onClick={() => { setSelectedSubmission(sub); setOpenFeedback(true); }}>Grade</Button>
                        </Box>
                      )}
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
                {submissions.length === 0 && <Box p={4} textAlign="center">No files submitted yet.</Box>}
              </List>
            </Paper>
          </Grid>
          
          {/* Right Sidebar: Team & Templates */}
          <Grid item xs={12} lg={4}>
            {/* Team Members */}
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Box display="flex" justifyContent="space-between"><Typography variant="h6" fontWeight="bold">Project Team</Typography>
              {user.role === 'student' && <IconButton onClick={() => setOpenAddMember(true)} color="primary"><AddMemberIcon /></IconButton>}</Box>
              <Divider sx={{ mb: 2 }} />
              <List>{project.teamMembers?.map((member) => <ListItem key={member._id}><ListItemText primary={member.profile?.fullName} secondary={member.email} /></ListItem>)}</List>
            </Paper>

            {/* Phase Templates Sidebar (NEW) */}
            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#e3f2fd' }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <FolderIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">Phase Templates</Typography>
                </Box>
                <List dense>
                    {resources.map((res) => (
                        <ListItem key={res._id} secondaryAction={<IconButton size="small" href={res.fileUrl} target="_blank"><DownloadIcon/></IconButton>}>
                            <ListItemText primary={res.title} secondary={res.phase === 'template' ? 'Resource' : `For ${res.phase} phase`} />
                        </ListItem>
                    ))}
                    {resources.length === 0 && <Typography variant="caption">No templates uploaded.</Typography>}
                </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: LOGS */}
      {tabValue === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="h5" fontWeight="bold">Weekly Logs ({logs.length}/24)</Typography>
            {user.role === 'student' && (
              <Button 
                variant="contained" 
                startIcon={<AddMemberIcon />} 
                onClick={() => setOpenLogModal(true)}
                disabled={logs.length >= 24} // Enforce 24 Log Limit
              >
                Add Log Entry
              </Button>
            )}
          </Box>
          <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f4f6f8' }}>
                <TableRow>
                  <TableCell><strong>#</strong></TableCell>
                  <TableCell><strong>Activity</strong></TableCell>
                  <TableCell><strong>Attachment</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Marks (10)</strong></TableCell>
                  {user.role === 'supervisor' && <TableCell align="right"><strong>Action</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>{log.logNumber}</TableCell>
                    <TableCell>{log.activity}</TableCell>
                    <TableCell>{log.fileUrl ? <a href={log.fileUrl} target="_blank" rel="noreferrer"><AttachIcon fontSize="small"/> View</a> : '-'}</TableCell>
                    <TableCell><Chip label={log.status} color={log.status === 'approved' ? 'success' : 'warning'} size="small" /></TableCell>
                    <TableCell>{log.status === 'approved' ? <b>{log.marks}/10</b> : '-'}</TableCell>
                    {user.role === 'supervisor' && log.status === 'pending' && (
                       <TableCell align="right">
                          <IconButton color="success" title="Approve & Grade" onClick={() => clickApproveLog(log._id)}><ApproveIcon /></IconButton>
                          <IconButton color="error" title="Reject & Delete" onClick={() => handleRejectLog(log._id)}><RejectIcon /></IconButton>
                       </TableCell>
                    )}
                  </TableRow>
                ))}
                {logs.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{py:4}}>No logs recorded.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}

      {/* --- MODALS --- */}

      {/* Upload Modal */}
      <Dialog open={openUpload} onClose={() => setOpenUpload(false)}>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent sx={{ width: 400 }}>
          <TextField autoFocus margin="dense" label="Document Title" fullWidth value={uploadData.title} onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })} />
          <TextField select margin="dense" label="Document Type" fullWidth value={uploadData.type} onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}>
            <MenuItem value="proposal">Proposal</MenuItem>
            <MenuItem value="report">Report</MenuItem>
            <MenuItem value="presentation">Presentation</MenuItem>
            <MenuItem value="mandatory_response">Mandatory Form Response</MenuItem>
          </TextField>
          <Button variant="outlined" component="label" fullWidth sx={{ mt: 2, height: 50, borderStyle: 'dashed' }}>
            {selectedFile ? selectedFile.name : "Click to Select File"}
            <input type="file" hidden onChange={(e) => setSelectedFile(e.target.files[0])} />
          </Button>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenUpload(false)}>Cancel</Button><Button onClick={handleUpload} variant="contained">Upload</Button></DialogActions>
      </Dialog>
      
      {/* Feedback/Grade Modal */}
      <Dialog open={openFeedback} onClose={() => setOpenFeedback(false)}>
        <DialogTitle>Evaluate Submission</DialogTitle>
        <DialogContent sx={{ width: 400 }}>
           <TextField label="Grade (Points)" type="number" fullWidth margin="dense" value={submissionGrade} onChange={(e) => setSubmissionGrade(e.target.value)} />
           <TextField label="Comments" fullWidth multiline rows={4} margin="dense" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenFeedback(false)}>Cancel</Button><Button onClick={handleFeedback} variant="contained">Submit Grade</Button></DialogActions>
      </Dialog>

      {/* Log Entry Modal */}
      <Dialog open={openLogModal} onClose={() => setOpenLogModal(false)}>
        <DialogTitle>Submit Log Entry</DialogTitle>
        <DialogContent sx={{ width: 400 }}>
          <TextField label="No." type="number" fullWidth margin="dense" value={logData.logNumber} onChange={(e) => setLogData({...logData,logNumber:e.target.value})} />
          <TextField label="Date" type="date" fullWidth margin="dense" InputLabelProps={{shrink:true}} value={logData.weekStartDate} onChange={(e) => setLogData({...logData,weekStartDate:e.target.value})} />
          <TextField label="Activity" multiline rows={3} fullWidth margin="dense" value={logData.activity} onChange={(e) => setLogData({...logData,activity:e.target.value})} />
          <TextField label="Hours" type="number" fullWidth margin="dense" value={logData.hoursSpent} onChange={(e) => setLogData({...logData,hoursSpent:e.target.value})} />
          <Button component="label" variant="outlined" fullWidth sx={{mt:2}}><input type="file" hidden onChange={e=>setLogFile(e.target.files[0])}/>Attach File</Button>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenLogModal(false)}>Cancel</Button><Button onClick={handleLogSubmit} variant="contained">Submit</Button></DialogActions>
      </Dialog>
      
      {/* Add Member Modal */}
      <Dialog open={openAddMember} onClose={() => setOpenAddMember(false)}>
        <DialogTitle>Add Team Member</DialogTitle>
        <DialogContent sx={{ width: 350 }}><TextField label="Email" fullWidth value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} /></DialogContent>
        <DialogActions><Button onClick={() => setOpenAddMember(false)}>Cancel</Button><Button onClick={handleAddMember} variant="contained">Add</Button></DialogActions>
      </Dialog>

      {/* Log Approval Modal (Supervisor) */}
      <Dialog open={openApproveLog} onClose={() => setOpenApproveLog(false)}>
        <DialogTitle>Approve Log</DialogTitle>
        <DialogContent sx={{ width: 300 }}>
           <Typography variant="body2" sx={{mb:2}}>Marks (0-10)</Typography>
           <TextField type="number" fullWidth autoFocus value={logScore} onChange={(e) => setLogScore(e.target.value)} />
        </DialogContent>
        <DialogActions>
           <Button onClick={() => setOpenApproveLog(false)}>Cancel</Button>
           <Button onClick={submitLogApproval} variant="contained" color="success">Approve</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default ProjectDetails;