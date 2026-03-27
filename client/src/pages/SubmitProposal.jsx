import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Paper, Typography, TextField, Button, Box, Alert, MenuItem, List, ListItem, ListItemText, IconButton, Divider 
} from '@mui/material';
import { CloudUpload, Download as DownloadIcon, ArrowBack } from '@mui/icons-material';

const SubmitProposal = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  
  // Data States
  const [supervisors, setSupervisors] = useState([]);
  const [proposalResource, setProposalResource] = useState(null); // The template to download
  
  // Form States
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    supervisorId: '' 
  });
  const [file, setFile] = useState(null);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const initPage = async () => {
      try {
        // 1. Check if Registration is Open (Resource Check)
        const resRes = await axios.get('http://localhost:5000/api/resources', config);
        const propRes = resRes.data.find(r => r.phase === 'proposal');
        
        if (!propRes) {
          alert("Registration is currently CLOSED. The Coordinator has not uploaded the Proposal Form yet.");
          navigate('/student-dashboard');
          return;
        }
        setProposalResource(propRes);

        // 2. Fetch Supervisors
        const supRes = await axios.get('http://localhost:5000/api/projects/supervisors', config);
        setSupervisors(supRes.data);

      } catch (err) { 
        console.error(err);
        setError("Failed to load registration data.");
      } finally {
        setLoading(false);
      }
    };

    if(token) initPage();
  }, [token, navigate, config]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("You must attach the filled Proposal Document.");
      return;
    }
    if (!formData.supervisorId) {
        setError("Please select a supervisor.");
        return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('supervisorId', formData.supervisorId); // Include Supervisor
    data.append('file', file);

    try {
      await axios.post('http://localhost:5000/api/projects', data, {
        headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
      });
      alert("Proposal Submitted Successfully!");
      navigate('/student-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || "Submission Failed");
    }
  };

  if (loading) return <Container sx={{mt:5}}>Loading form...</Container>;

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/student-dashboard')} sx={{ mb: 2 }}>
        Back to Dashboard
      </Button>
      
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
          Register FYP Topic
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
          <strong>Instructions:</strong>
          <ol style={{margin: '8px 0 0 20px', padding: 0}}>
            <li>Download the mandatory proposal form below.</li>
            <li>Fill it out in consultation with your supervisor.</li>
            <li>Complete the form below and attach the signed document.</li>
          </ol>
        </Alert>

        {/* DOWNLOAD TEMPLATE SECTION */}
        {proposalResource && (
          <Box sx={{ mb: 4, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9' }}>
            <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">STEP 1: DOWNLOAD TEMPLATE</Typography>
            <List dense sx={{bgcolor: 'white', borderRadius: 1}}>
              <ListItem 
                secondaryAction={
                  <IconButton edge="end" href={proposalResource.fileUrl} target="_blank" color="primary">
                    <DownloadIcon />
                  </IconButton>
                }
              >
                <ListItemText 
                  primary={proposalResource.title} 
                  secondary={proposalResource.deadline ? `Deadline: ${new Date(proposalResource.deadline).toLocaleDateString()}` : "No deadline set"} 
                />
              </ListItem>
            </List>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">STEP 2: SUBMIT DETAILS</Typography>

        {/* SUBMISSION FORM */}
        <form onSubmit={handleSubmit}>
          <TextField 
            name="title"
            label="Project Title" 
            fullWidth 
            margin="normal" 
            required 
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
          
          <TextField 
            name="description"
            label="Problem Statement / Abstract" 
            fullWidth 
            multiline 
            rows={4} 
            margin="normal" 
            required 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />

          <TextField
            select
            fullWidth
            required
            label="Select Supervisor"
            margin="normal"
            value={formData.supervisorId}
            onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
          >
            {supervisors.map((sup) => (
              <MenuItem key={sup._id} value={sup._id}>
                {sup.profile?.fullName || 'Unknown Supervisor'}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ mt: 3, mb: 4 }}>
            <Typography variant="body2" gutterBottom fontWeight="bold">Attach Filled Proposal Document *</Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ height: 60, borderStyle: 'dashed', borderColor: file ? 'green' : 'grey', color: file ? 'green' : 'inherit' }}
              startIcon={<CloudUpload />}
            >
              {file ? file.name : "Click to Upload Filled Form (PDF/Docx)"}
              <input type="file" hidden onChange={(e) => setFile(e.target.files[0])} />
            </Button>
          </Box>

          <Button type="submit" variant="contained" size="large" fullWidth sx={{ py: 1.5, fontSize: '1.1rem' }}>
            Submit Proposal
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default SubmitProposal;