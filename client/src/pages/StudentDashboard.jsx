import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, Button, Grid, Paper, Box, Chip, CircularProgress, Divider, Avatar, Container, Alert, LinearProgress, List, ListItem, ListItemText, IconButton, Card, CardContent 
} from '@mui/material';
import { 
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector, 
  TimelineContent, TimelineDot 
} from '@mui/lab';
import { 
  CheckCircle as CheckIcon, RadioButtonUnchecked as PendingIcon, ArrowForward as ArrowIcon, EmojiEvents as TrophyIcon, 
  Campaign as AnnounceIcon, Folder as FolderIcon, Download as DownloadIcon, CalendarToday as DateIcon
} from '@mui/icons-material';

const StudentDashboard = () => {
  const { token, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // Data States
  const [project, setProject] = useState(null);
  const [logCount, setLogCount] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [pendingResources, setPendingResources] = useState([]); 
  const [announcements, setAnnouncements] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [proposalTemplateAvailable, setProposalTemplateAvailable] = useState(false);

  const steps = [
    { label: 'Registration', status: 'registered' },
    { label: 'Proposal Defense', status: 'proposal_approved' },
    { label: 'Midterm Evaluation', status: 'midterm_completed' },
    { label: 'Final Viva', status: 'final_viva_completed' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      console.log("AUTH CHECK:");
      console.log("token:", token);
      console.log("user:", user);
      try {
        // 1. Announcements
        try {
          const annRes = await axios.get('http://localhost:5000/api/dashboard/announcements', config);
          setAnnouncements(annRes.data);
        } catch (e) { console.error("Announcements Error"); }

        // 2. Templates & Resources (Check for Proposal Availability)
        try {
          const tempRes = await axios.get('http://localhost:5000/api/dashboard/templates', config);
          setTemplates(tempRes.data);

          const allResources = await axios.get('http://localhost:5000/api/resources', config);
          // Check if 'proposal' phase exists
          const hasProposal = allResources.data.some(r => r.phase === 'proposal');
          setProposalTemplateAvailable(hasProposal);

        } catch (e) { console.error("Templates/Resource Error"); }

        // 3. Project Data
        const projRes = await axios.get('http://localhost:5000/api/projects', config);
        
        if (Array.isArray(projRes.data) && projRes.data.length > 0) {
          const currentProject = projRes.data[0];
          setProject(currentProject);

          // Logs
          try {
            const logRes = await axios.get(`http://localhost:5000/api/logs/${currentProject._id}`, config);
            setLogCount(logRes.data.filter(l => l.status === 'approved').length);
          } catch (e) {}

          // Mandatory Forms (Exclude templates)
          try {
            const resRes = await axios.get('http://localhost:5000/api/resources', config);
            const activeResources = resRes.data.filter(r => r.phase !== 'template' && new Date(r.deadline) > new Date());
            const subRes = await axios.get(`http://localhost:5000/api/submissions/${currentProject._id}`, config);
            const submittedCount = subRes.data.filter(s => s.type === 'mandatory_response').length;
            setPendingResources(activeResources.slice(0, Math.max(0, activeResources.length - submittedCount)));
          } catch (e) {}
        }
      } catch (err) { console.error("Dashboard Error:", err); } 
      finally { setLoading(false); }
    };

    if (token) fetchData();
  }, [token]);

  const activeStep = project ? steps.findIndex(s => s.status === project.status) : -1;

  // --- SMART ACTION LOGIC ---
  const renderSmartAction = () => {
    if (!project) return null;

    if (project.status === 'proposal_approved') {
      if (logCount >= 12 && !project.hasMidtermPresentation) {
        return (
          <Alert severity="info" variant="filled" sx={{ mb: 3, borderRadius: 2 }} action={
            <Button color="inherit" variant="outlined" size="small" onClick={() => navigate(`/projects/${project._id}`)}>Upload Now</Button>
          }>
            <strong>Action Required:</strong> You have met the log requirement (12+). Please upload your <strong>Midterm Presentation</strong>.
          </Alert>
        );
      } else if (logCount < 12) {
        return <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}><strong>Pending:</strong> 12 approved logs required for Midterm (Current: {logCount}).</Alert>;
      }
    }

    if (project.status === 'midterm_completed') {
      if (logCount >= 24 && !project.hasFinalReport) {
        return (
          <Alert severity="info" variant="filled" sx={{ mb: 3, borderRadius: 2 }} action={
            <Button color="inherit" variant="outlined" size="small" onClick={() => navigate(`/projects/${project._id}`)}>Upload Now</Button>
          }>
            <strong>Action Required:</strong> Log requirement met (24). Please upload your <strong>Final Report</strong>.
          </Alert>
        );
      } else if (logCount < 24) {
        return <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}><strong>Pending:</strong> 24 approved logs required for Final Viva (Current: {logCount}).</Alert>;
      }
    }
    return null;
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 10 }} />;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      
      {/* 1. HERO SECTION */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, mb: 4, borderRadius: 4, color: 'white',
          background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="800">Hello, {user?.name}</Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.9, mt: 1 }}>
            Track your FYP progress, manage submissions, and view results.
          </Typography>
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.1)', p: 1.5, borderRadius: 2 }}>
          <DateIcon />
          <Typography fontWeight="bold">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Typography>
        </Box>
      </Paper>

      {/* 2. ALERTS AREA */}
      {renderSmartAction()}
      {pendingResources.length > 0 && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} action={<Button color="inherit" size="small" onClick={() => navigate(`/projects/${project?._id}`)}>View</Button>}>
          <strong>Compliance Check:</strong> You have {pendingResources.length} mandatory form(s) pending submission.
        </Alert>
      )}
      
      {/* 3. NO PROJECT / REGISTRATION STATE */}
      {!project ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '2px dashed #ccc', bgcolor: '#fafafa' }}>
          <Typography variant="h5" color="textSecondary" gutterBottom>No Active Project Found</Typography>
          
          {proposalTemplateAvailable ? (
            <>
              <Typography color="textSecondary" paragraph>Applications for FYP Proposals are currently OPEN.</Typography>
              <Button variant="contained" size="large" onClick={() => navigate('/submit-proposal')} sx={{ mt: 2, px: 5, borderRadius: 5 }}>
                Register FYP Topic
              </Button>
            </>
          ) : (
            <Alert severity="warning" sx={{ maxWidth: 600, mx: 'auto', mt: 2, borderRadius: 2 }}>
              <Typography fontWeight="bold">Registration Closed</Typography>
              The Coordinator has not yet uploaded the Proposal Template/Form. Please wait for the announcement.
            </Alert>
          )}
        </Paper>
      ) : (
        <Grid container spacing={4}>
          
          {/* --- LEFT COLUMN (MAIN CONTENT) --- */}
          <Grid item xs={12} lg={8}>
            
            {/* Project Card */}
            <Card sx={{ borderRadius: 4, mb: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'visible' }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
                  <Box>
                    <Typography variant="overline" color="textSecondary" fontWeight="bold" letterSpacing={1.5}>FYP TITLE</Typography>
                    <Typography variant="h4" fontWeight="800" sx={{ color: '#1a237e', mt: 0.5 }}>{project.title}</Typography>
                  </Box>
                  <Chip 
                    label={project.status.replace(/_/g, ' ').toUpperCase()} 
                    color={project.status.includes('required') ? 'error' : 'success'} 
                    sx={{ fontWeight: 'bold', borderRadius: 2, px: 1 }}
                  />
                </Box>

                <Typography variant="body1" paragraph sx={{ color: '#555', lineHeight: 1.7, mb: 4 }}>{project.description}</Typography>
                <Divider light sx={{ mb: 3 }} />

                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56, fontSize: '1.2rem' }}>
                    {project.supervisorId?.profile?.fullName?.charAt(0) || '?'}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" display="block" color="textSecondary" fontWeight="bold">ASSIGNED SUPERVISOR</Typography>
                    <Typography variant="h6">{project.supervisorId?.profile?.fullName || 'Pending Assignment'}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Performance Card */}
            <Card sx={{ borderRadius: 4, mb: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={4}>
                  <TrophyIcon color="warning" fontSize="large" />
                  <Typography variant="h5" fontWeight="bold">Performance Overview</Typography>
                </Box>
                
                <Grid container spacing={4}>
                  <Grid item xs={12} md={4}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight="bold" color="textSecondary">LOGS</Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary">{project.marks?.supervisorLogs || 0}/30</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={Math.min(((project.marks?.supervisorLogs || 0)/30)*100, 100)} sx={{height:10, borderRadius:5, bgcolor:'#e3f2fd', '& .MuiLinearProgress-bar':{bgcolor:'#1976d2'}}} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight="bold" color="textSecondary">MIDTERM</Typography>
                      <Typography variant="body2" fontWeight="bold" color="secondary">{project.marks?.midterm || 0}/30</Typography>
                    </Box>
                    <LinearProgress variant="determinate" color="secondary" value={Math.min(((project.marks?.midterm || 0)/30)*100, 100)} sx={{height:10, borderRadius:5, bgcolor:'#f3e5f5', '& .MuiLinearProgress-bar':{bgcolor:'#9c27b0'}}} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight="bold" color="textSecondary">FINAL VIVA</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">{project.marks?.finalViva || 0}/40</Typography>
                    </Box>
                    <LinearProgress variant="determinate" color="success" value={Math.min(((project.marks?.finalViva || 0)/40)*100, 100)} sx={{height:10, borderRadius:5, bgcolor:'#e8f5e9', '& .MuiLinearProgress-bar':{bgcolor:'#2e7d32'}}} />
                  </Grid>
                </Grid>

                {project.status === 'graduated' && (
                  <Alert severity="success" icon={<TrophyIcon fontSize="inherit" />} sx={{ mt: 4, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Congratulations! Total Score: {project.marks?.total} / 100</Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Notice Board */}
            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 0 }}>
                <Box p={3} borderBottom="1px solid #eee" display="flex" alignItems="center" gap={1}>
                  <AnnounceIcon color="info" />
                  <Typography variant="h6" fontWeight="bold">Notice Board</Typography>
                </Box>
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {announcements.length > 0 ? announcements.map((ann) => (
                    <React.Fragment key={ann._id}>
                      <ListItem alignItems="flex-start" sx={{ px: 3, py: 2 }}>
                        <ListItemText 
                          primary={<Typography variant="subtitle2" fontWeight="bold">{ann.title}</Typography>}
                          secondary={
                            <>
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                {new Date(ann.createdAt).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2" color="text.primary">{ann.content}</Typography>
                            </>
                          } 
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  )) : <Box p={4} textAlign="center"><Typography variant="body2" color="textSecondary">No active announcements.</Typography></Box>}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* --- RIGHT COLUMN (SIDEBAR) --- */}
          <Grid item xs={12} lg={4}>
            <Grid container direction="column" spacing={3}>
              
              {/* Quick Action Card */}
              <Grid item xs={12}>
                <Paper sx={{ p: 4, borderRadius: 4, bgcolor: '#1a237e', color: 'white', textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>Project Hub</Typography>
                  <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
                    Central place for all your files, logs, and supervisor feedback.
                  </Typography>
                  <Button 
                    variant="contained" color="secondary" fullWidth size="large"
                    endIcon={<ArrowIcon />} onClick={() => navigate(`/projects/${project._id}`)}
                    sx={{ fontWeight: 'bold', borderRadius: 3, py: 1.5 }}
                  >
                    Open Hub
                  </Button>
                </Paper>
              </Grid>

              {/* Downloads / Templates */}
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 0 }}>
                    <Box p={3} borderBottom="1px solid #eee" display="flex" alignItems="center" gap={1}>
                      <FolderIcon color="action" />
                      <Typography variant="h6" fontWeight="bold">Downloads</Typography>
                    </Box>
                    <List dense>
                      {templates.map((temp) => (
                        <ListItem key={temp._id} secondaryAction={
                          <IconButton edge="end" href={temp.fileUrl} target="_blank" color="primary"><DownloadIcon /></IconButton>
                        }>
                          <ListItemText primary={temp.title} primaryTypographyProps={{fontWeight:500}} />
                        </ListItem>
                      ))}
                      {templates.length === 0 && <Box p={3} textAlign="center"><Typography variant="caption">No templates available.</Typography></Box>}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Roadmap */}
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>Roadmap</Typography>
                    <Timeline position="right" sx={{ p: 0, m: 0, mt: 2 }}>
                      {steps.map((step, index) => (
                        <TimelineItem key={index} sx={{ '&:before': { display: 'none' } }}>
                          <TimelineSeparator>
                            <TimelineDot 
                              color={index <= activeStep ? "success" : "grey"} 
                              variant={index <= activeStep ? "filled" : "outlined"}
                            >
                               {index <= activeStep ? <CheckIcon fontSize="small"/> : <PendingIcon fontSize="small"/>}
                            </TimelineDot>
                            {index < steps.length - 1 && <TimelineConnector sx={{ bgcolor: index < activeStep ? 'success.main' : '#e0e0e0' }} />}
                          </TimelineSeparator>
                          <TimelineContent sx={{ py: '12px', px: 2 }}>
                            <Typography variant="body2" fontWeight={index === activeStep ? 'bold' : 'normal'} color={index <= activeStep ? "text.primary" : "text.secondary"}>
                              {step.label}
                            </Typography>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  </CardContent>
                </Card>
              </Grid>

            </Grid>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default StudentDashboard;