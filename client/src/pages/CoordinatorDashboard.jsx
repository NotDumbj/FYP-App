import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, 
  Chip, IconButton, Box, Container, Tabs, Tab, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Grid, Card, CardContent, List, ListItem, ListItemText, ListItemAvatar, Avatar, MenuItem 
} from '@mui/material';
import { 
  Event as ScheduleIcon, Visibility as ViewIcon,
  Search as CheckIcon, Publish as PublishIcon, 
  Download as DownloadIcon, Description as FileIcon, Dashboard as DashIcon,
  Campaign as AnnounceIcon, Folder as FolderIcon, History as HistoryIcon,
  SaveAlt as ExportIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CoordinatorDashboard = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // Data States
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]); 
  const [submissions, setSubmissions] = useState({}); 
  
  // UI States
  const [tabValue, setTabValue] = useState(0);
  const [openPlag, setOpenPlag] = useState(false);
  const [similarity, setSimilarity] = useState('');
  const [selectedPid, setSelectedPid] = useState(null);
  
  // Form States
  const [resData, setResData] = useState({ title: '', deadline: '', phase: 'midterm', file: null });
  const [templateData, setTemplateData] = useState({ title: '', file: null });
  const [announcement, setAnnouncement] = useState({ title: '', content: '', roleTarget: 'both' });

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = async () => {
    try {
      const projRes = await axios.get('http://localhost:5000/api/projects', config);
      setProjects(projRes.data);
      const logRes = await axios.get('http://localhost:5000/api/audit', config);
      setLogs(logRes.data);

      const candidates = projRes.data.filter(p => p.status === 'final_report_submitted' || (p.hasFinalReport && p.status === 'midterm_completed'));
      const subsMap = {};
      for (const p of candidates) {
        try {
          const subRes = await axios.get(`http://localhost:5000/api/submissions/${p._id}`, config);
          const report = subRes.data.reverse().find(s => s.type === 'report'); 
          if (report) subsMap[p._id] = report.fileUrl;
        } catch (e) { console.error("File fetch error", e); }
      }
      setSubmissions(subsMap);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (token) fetchData(); }, [token, fetchData]);

  // --- HANDLERS ---

  // NEW: Download All Student Records
  const downloadRecords = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text("FYP Student Records & Results", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    // Filter Graduated/Completed Projects
    const completedProjects = projects.filter(p => p.status === 'graduated' || p.status === 'final_completed');

    if (completedProjects.length === 0) return alert("No completed student records found to export.");

    const tableData = completedProjects.map(p => [
      p.studentId?.profile?.fullName || "N/A",
      p.title || "N/A",
      p.supervisorId?.profile?.fullName || "N/A",
      p.marks?.supervisorLogs || 0,
      p.marks?.midterm || 0,
      p.marks?.finalViva || 0,
      (p.marks?.supervisorLogs || 0) + (p.marks?.midterm || 0) + (p.marks?.finalViva || 0) // Total
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Student Name', 'Project Title', 'Supervisor', 'Logs (30)', 'Mid (30)', 'Final (40)', 'Total (100)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133] }, // Teal color
    });

    doc.save('FYP_Student_Records.pdf');
  };

  const handlePlagiarismCheck = async () => {
    const score = parseInt(similarity);
    if(isNaN(score)) return alert("Enter valid number");
    try {
      await axios.put(`http://localhost:5000/api/projects/${selectedPid}/plagiarism`, { similarity: score }, config);
      setOpenPlag(false); setSimilarity(''); fetchData();
      alert(score > 20 ? "High Similarity: Returned to student." : "Cleared! Sent to Panelist.");
    } catch (err) { alert("Error"); }
  };

  const handlePublish = async (id) => {
    if(!window.confirm("Compile marks and Graduate student?")) return;
    try { await axios.put(`http://localhost:5000/api/projects/${id}/publish`, {}, config); fetchData(); alert("Published!"); } catch (err) { alert("Error"); }
  };

  const handleUploadResource = async (isTemplate = false) => {
    try {
      const formData = new FormData();
      
      if (isTemplate) {
        if(!templateData.file) return alert("Select file");
        formData.append('title', templateData.title);
        formData.append('file', templateData.file);
        
        await axios.post('http://localhost:5000/api/dashboard/templates', formData, { 
            headers: { ...config.headers, 'Content-Type': 'multipart/form-data' } 
        });
        alert("Template Uploaded!");
        setTemplateData({ title: '', file: null });
      } else {
        if(!resData.file || !resData.title || !resData.deadline) return alert("Please fill all fields and select a file.");
        
        formData.append('title', resData.title);
        formData.append('deadline', resData.deadline);
        formData.append('phase', resData.phase);
        formData.append('file', resData.file);

        await axios.post('http://localhost:5000/api/resources', formData, { 
            headers: { ...config.headers, 'Content-Type': 'multipart/form-data' } 
        });
        alert("Mandatory Form Assigned!");
        setResData({ title: '', deadline: '', phase: 'midterm', file: null });
      }
    } catch (err) { alert("Upload Failed"); }
  };

  const handlePostAnnouncement = async () => {
    if(!announcement.title || !announcement.content || !announcement.roleTarget) return alert("Fill all fields");
    try {
        await axios.post('http://localhost:5000/api/dashboard/announcements', announcement, config);
        alert("Announcement Broadcasted!");
        setAnnouncement({ title: '', content: '', roleTarget: 'both' });
    } catch(e) { alert("Error posting"); }
  };

  const downloadLogs = () => {
    const doc = new jsPDF();
    doc.text("System Audit Logs", 14, 20);
    autoTable(doc, {
      startY: 35, head: [['Time', 'User', 'Role', 'Action', 'Details']],
      body: logs.map(l => [new Date(l.createdAt).toLocaleString(), l.user?.profile?.fullName, l.user?.role, l.action, l.details]),
    });
    doc.save('audit_logs.pdf');
  };

  // --- CALCULATED STATS ---
  const pendingPlag = projects.filter(p => p.status === 'final_report_submitted').length;
  const readyToPublish = projects.filter(p => p.status === 'final_completed').length;
  const activeCount = projects.length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* HEADER */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
            <Typography variant="h4" fontWeight="800" color="primary" sx={{ letterSpacing: '-0.5px' }}>
            Coordinator Console
            </Typography>
            <Typography variant="body1" color="textSecondary">
            Manage FYP Lifecycle, Resources, and Grading.
            </Typography>
        </Box>
        <Box display="flex" gap={2}>
            <Button variant="outlined" color="secondary" startIcon={<ExportIcon />} onClick={downloadRecords}>
              Export Records
            </Button>
            <Button variant="contained" size="large" startIcon={<ScheduleIcon />} onClick={() => navigate('/schedule-defense')}>
              Schedule Defense
            </Button>
        </Box>
      </Box>

      {/* TABS */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            textColor="primary" 
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
        >
          <Tab label="Dashboard" icon={<DashIcon/>} iconPosition="start" />
          <Tab 
            icon={<CheckIcon/>} 
            iconPosition="start" 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Plagiarism 
                {pendingPlag > 0 && <Chip label={pendingPlag} color="error" size="small"/>}
              </Box>
            }
          />
          <Tab label="Publish" icon={<PublishIcon/>} iconPosition="start" />
          <Tab label="Resources" icon={<FolderIcon/>} iconPosition="start" />
          <Tab label="Broadcast" icon={<AnnounceIcon/>} iconPosition="start" />
          <Tab label="Logs" icon={<HistoryIcon/>} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* --- TAB 0: DASHBOARD OVERVIEW --- */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: '#e3f2fd', boxShadow: 'none', border: '1px solid #bbdefb' }}>
                    <CardContent>
                        <Typography color="textSecondary" variant="overline" fontWeight="bold">Total Projects</Typography>
                        <Typography variant="h3" fontWeight="800" color="primary">{activeCount}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: '#fff3e0', boxShadow: 'none', border: '1px solid #ffe0b2' }}>
                    <CardContent>
                        <Typography color="textSecondary" variant="overline" fontWeight="bold">Pending Checks</Typography>
                        <Typography variant="h3" fontWeight="800" color="warning.main">{pendingPlag}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: '#e8f5e9', boxShadow: 'none', border: '1px solid #c8e6c9' }}>
                    <CardContent>
                        <Typography color="textSecondary" variant="overline" fontWeight="bold">Ready to Publish</Typography>
                        <Typography variant="h3" fontWeight="800" color="success.main">{readyToPublish}</Typography>
                    </CardContent>
                </Card>
            </Grid>

            {/* Main List */}
            <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} px={1}>
                        <Typography variant="h6" fontWeight="bold">Active Projects</Typography>
                        <Button size="small" onClick={() => setTabValue(2)}>View All</Button>
                    </Box>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}><TableRow><TableCell>Title</TableCell><TableCell>Status</TableCell><TableCell align="right">View</TableCell></TableRow></TableHead>
                        <TableBody>
                            {projects.slice(0, 8).map(p => (
                                <TableRow key={p._id} hover>
                                    <TableCell>{p.title}</TableCell>
                                    <TableCell><Chip label={p.status.replace(/_/g,' ')} size="small" variant="outlined"/></TableCell>
                                    <TableCell align="right"><IconButton size="small" onClick={() => navigate(`/projects/${p._id}`)}><ViewIcon/></IconButton></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            </Grid>

            {/* Live Activity Feed */}
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <HistoryIcon color="action" />
                        <Typography variant="h6" fontWeight="bold">Live Activity</Typography>
                    </Box>
                    <List dense>
                        {logs.slice(0, 6).map((log) => (
                            <React.Fragment key={log._id}>
                                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                    <ListItemAvatar><Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{log.user?.profile?.fullName?.charAt(0)}</Avatar></ListItemAvatar>
                                    <ListItemText primary={log.action} secondary={
                                        <Typography variant="caption" color="text.secondary">
                                            {log.user?.profile?.fullName} • {new Date(log.createdAt).toLocaleTimeString()}
                                        </Typography>
                                    } />
                                </ListItem>
                                <Divider variant="inset" component="li" />
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            </Grid>
        </Grid>
      )}

      {/* --- TAB 1: PLAGIARISM --- */}
      {tabValue === 1 && (
        <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 2 }}>
            <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                        <TableCell><strong>Student</strong></TableCell>
                        <TableCell><strong>Title</strong></TableCell>
                        <TableCell><strong>Document</strong></TableCell>
                        <TableCell align="right"><strong>Action</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {projects.filter(p => p.status === 'final_report_submitted' || (p.hasFinalReport && p.status === 'midterm_completed')).map(p => (
                        <TableRow key={p._id}>
                            <TableCell>{p.studentId?.profile?.fullName}</TableCell>
                            <TableCell>{p.title}</TableCell>
                            <TableCell>
                                {submissions[p._id] ? (
                                    <Button size="small" variant="outlined" startIcon={<FileIcon/>} href={submissions[p._id]} target="_blank">View Report</Button>
                                ) : <Typography variant="caption" color="error">File fetch error</Typography>}
                            </TableCell>
                            <TableCell align="right">
                                <Button variant="contained" size="small" onClick={() => {setSelectedPid(p._id); setOpenPlag(true);}}>Input Score</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {projects.filter(p => p.status === 'final_report_submitted').length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{py:4}}>No pending checks.</TableCell></TableRow>}
                </TableBody>
            </Table>
        </Paper>
      )}

      {/* --- TAB 2: PUBLISH --- */}
      {tabValue === 2 && (
        <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 2 }}>
            <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}><TableRow><TableCell>Student</TableCell><TableCell>Breakdown</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
                <TableBody>
                    {projects.filter(p => p.status === 'final_completed').map(p => (
                        <TableRow key={p._id}>
                            <TableCell>{p.studentId?.profile?.fullName}</TableCell>
                            <TableCell>
                                <Box sx={{ bgcolor: '#f9fbe7', p: 1, borderRadius: 1, display: 'inline-block' }}>
                                    <Typography variant="caption">Sup: <b>{p.marks?.supervisorLogs}</b> | Mid: <b>{p.marks?.midterm}</b> | Viva: <b>{p.marks?.finalViva}</b></Typography>
                                    <Divider sx={{my:0.5}}/>
                                    <Typography variant="subtitle2" fontWeight="bold">Total: {(p.marks?.supervisorLogs||0)+(p.marks?.midterm||0)+(p.marks?.finalViva||0)}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell align="right">
                                <Button variant="contained" color="success" onClick={() => handlePublish(p._id)}>Graduate</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
      )}

      {/* --- TAB 3: RESOURCES & TEMPLATES --- */}
      {tabValue === 3 && (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>1. Assign Mandatory Form</Typography>
                    <Typography variant="body2" color="textSecondary" mb={2}>Upload form template that students must submit.</Typography>
                    
                    <TextField label="Task Title" fullWidth size="small" margin="dense" value={resData.title} onChange={e=>setResData({...resData, title:e.target.value})} />
                    
                    <TextField select label="Phase" fullWidth size="small" margin="dense" value={resData.phase} onChange={e=>setResData({...resData, phase:e.target.value})}>
                        <MenuItem value="proposal">Proposal</MenuItem>
                        <MenuItem value="midterm">Midterm</MenuItem>
                        <MenuItem value="final">Final</MenuItem>
                    </TextField>

                    <TextField type="date" label="Deadline" fullWidth size="small" margin="dense" InputLabelProps={{shrink:true}} value={resData.deadline} onChange={e=>setResData({...resData, deadline:e.target.value})} />
                    
                    <Button variant="outlined" component="label" fullWidth sx={{mt:2, height:50, borderStyle:'dashed'}}>
                        {resData.file ? resData.file.name : "Attach Template File (Required)"}
                        <input type="file" hidden onChange={e=>setResData({...resData, file:e.target.files[0]})}/>
                    </Button>

                    <Button variant="contained" fullWidth sx={{mt:2}} onClick={() => handleUploadResource(false)}>Assign Task</Button>
                </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>2. Upload Student Resource</Typography>
                    <Typography variant="body2" color="textSecondary" mb={2}>General files for "Downloads" section (e.g., Logo, Guidelines).</Typography>
                    
                    <TextField label="Resource Name" fullWidth size="small" margin="dense" value={templateData.title} onChange={e=>setTemplateData({...templateData, title:e.target.value})} />
                    
                    <Button variant="outlined" component="label" fullWidth sx={{mt:1, mb:2, height:50, borderStyle:'dashed'}}>
                        {templateData.file ? templateData.file.name : "Select Document"}
                        <input type="file" hidden onChange={e=>setTemplateData({...templateData, file:e.target.files[0]})}/>
                    </Button>
                    
                    <Button variant="contained" color="secondary" fullWidth onClick={() => handleUploadResource(true)}>Upload Resource</Button>
                </Paper>
            </Grid>
        </Grid>
      )}

      {/* --- TAB 4: BROADCAST --- */}
      {tabValue === 4 && (
        <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AnnounceIcon color="primary" fontSize="large" />
                <Typography variant="h5">Make Announcement</Typography>
            </Box>
            
            <TextField label="Subject" fullWidth margin="normal" value={announcement.title} onChange={e=>setAnnouncement({...announcement, title:e.target.value})} />
            
            <TextField 
              select 
              label="Target Audience" 
              fullWidth 
              margin="normal" 
              value={announcement.roleTarget} 
              onChange={e=>setAnnouncement({...announcement, roleTarget:e.target.value})}
            >
              <MenuItem value="student">Students Only</MenuItem>
              <MenuItem value="supervisor">Supervisors Only</MenuItem>
              <MenuItem value="both">Both (Students & Supervisors)</MenuItem>
            </TextField>

            <TextField label="Message" multiline rows={4} fullWidth margin="normal" value={announcement.content} onChange={e=>setAnnouncement({...announcement, content:e.target.value})} />
            
            <Button variant="contained" fullWidth size="large" sx={{mt:2}} onClick={handlePostAnnouncement}>Post to Notice Board</Button>
        </Paper>
      )}

      {/* --- TAB 5: LOGS --- */}
      {tabValue === 5 && (
        <Paper sx={{ p: 2 }}>
            <Button startIcon={<DownloadIcon/>} onClick={downloadLogs} sx={{mb:2}}>Export PDF</Button>
            <Table size="small">
                <TableHead sx={{ bgcolor: '#333' }}><TableRow><TableCell sx={{color:'white'}}>Time</TableCell><TableCell sx={{color:'white'}}>User</TableCell><TableCell sx={{color:'white'}}>Action</TableCell><TableCell sx={{color:'white'}}>Details</TableCell></TableRow></TableHead>
                <TableBody>
                    {logs.map(l => (
                        <TableRow key={l._id}>
                            <TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell>
                            <TableCell>{l.user?.profile?.fullName || 'System'} ({l.user?.role})</TableCell>
                            <TableCell><strong>{l.action}</strong></TableCell>
                            <TableCell>{l.details}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
      )}

      {/* PLAGIARISM MODAL */}
      <Dialog open={openPlag} onClose={() => setOpenPlag(false)}>
        <DialogTitle>Turnitin Check</DialogTitle>
        <DialogContent sx={{ width: 350 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>Scores &gt; 20% trigger revision.</Typography>
          <TextField autoFocus label="Similarity %" type="number" fullWidth value={similarity} onChange={(e) => setSimilarity(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPlag(false)}>Cancel</Button>
          <Button onClick={handlePlagiarismCheck} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CoordinatorDashboard;