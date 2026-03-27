import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { 
  Container, Paper, Typography, TextField, Button, Grid, Slider, Box, MenuItem, Alert 
} from '@mui/material';

const EvaluationPanel = () => {
  const { token } = useSelector((state) => state.auth);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  
  // Rubric State
  const [scores, setScores] = useState({
    technicalDepth: 5,
    methodology: 5,
    presentation: 5,
    documentation: 5,
    innovation: 5
  });
  const [comments, setComments] = useState('');

  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch Projects eligible for Final Viva
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/projects', config);
        // FILTER: Only show projects that have passed Midterm (Ready for Final)
        const finalCandidates = res.data.filter(p => p.status === 'midterm_completed');
        setProjects(finalCandidates);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjects();
  }, [token, config]);

  const handleScoreChange = (name) => (e, value) => {
    setScores({ ...scores, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:5000/api/evaluations', {
        projectId: selectedProject,
        type: 'final_viva', // Hardcoded to Final Viva
        criteria: scores,
        comments
      }, config);
      
      alert('Final Evaluation Submitted Successfully!');
      setSelectedProject('');
      setComments('');
      // Reset scores
      setScores({ technicalDepth: 5, methodology: 5, presentation: 5, documentation: 5, innovation: 5 });
    } catch (err) {
      alert(err.response?.data?.message || 'Submission Failed');
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom color="primary" fontWeight="bold">
          Final Viva Evaluation
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          This digital rubric is restricted to the Final Evaluation phase. Select a candidate who has passed the midterm board.
        </Typography>

        {projects.length === 0 ? (
           <Alert severity="info">No projects are currently eligible for Final Viva evaluation.</Alert>
        ) : (
          <TextField
            select label="Select Final Year Candidate" fullWidth margin="normal"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            {projects.map(p => (
              <MenuItem key={p._id} value={p._id}>
                {p.title} - {p.studentId?.profile?.fullName}
              </MenuItem>
            ))}
          </TextField>
        )}

        {selectedProject && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
              Scoring Criteria (1-10)
            </Typography>
            
            <Grid container spacing={4} sx={{ mt: 1 }}>
              {Object.keys(scores).map((key) => (
                <Grid item xs={12} sm={6} key={key}>
                  <Typography gutterBottom fontWeight="500">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Typography>
                  <Slider
                    value={scores[key]}
                    onChange={handleScoreChange(key)}
                    step={1} min={1} max={10} marks valueLabelDisplay="auto"
                    sx={{ color: 'secondary.main' }}
                  />
                </Grid>
              ))}
            </Grid>

            <TextField
              label="Panelist Remarks"
              multiline rows={4} fullWidth margin="normal"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              sx={{ mt: 3 }}
            />

            <Button 
              variant="contained" size="large" fullWidth sx={{ mt: 3, py: 1.5, fontSize: '1.1rem' }}
              onClick={handleSubmit}
            >
              Submit Final Score
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default EvaluationPanel;