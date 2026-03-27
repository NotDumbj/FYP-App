import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, Grid, Paper, AppBar, Toolbar } from '@mui/material';
import { School, ArrowForward, CheckCircle } from '@mui/icons-material';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #020c1b 0%, #0a192f 100%)', // Deep Navy Gradient
      color: '#e6f1ff', // Soft White text
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* 1. Transparent Navbar */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ py: 2 }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <School sx={{ fontSize: 40, color: '#fb8c00', mr: 2 }} />
            <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1, letterSpacing: 1 }}>
              AFMS <span style={{ opacity: 0.6, fontWeight: 300 }}>| Bahria University</span>
            </Typography>
            <Button color="inherit" onClick={() => navigate('/login')} sx={{ mr: 2 }}>Login</Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={() => navigate('/register')}
              sx={{ borderRadius: 20 }}
            >
              Get Started
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      {/* 2. Hero Section */}
      <Container maxWidth="lg" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          
          {/* Left Text */}
          <Grid item xs={12} md={6}>
            <Typography variant="overline" color="secondary" sx={{ letterSpacing: 3, fontWeight: 'bold' }}>
              ACADEMIC EXCELLENCE
            </Typography>
            <Typography variant="h2" fontWeight="900" sx={{ lineHeight: 1.1, mb: 3, background: '-webkit-linear-gradient(45deg, #ccd6f6, #8892b0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Automated FYP <br /> Management System
            </Typography>
            <Typography variant="h6" sx={{ color: '#8892b0', mb: 5, fontWeight: 400, lineHeight: 1.6 }}>
              The centralized platform for students and supervisors. 
              Track proposals, submit your <strong>24-Log Forms</strong>, and manage project milestones efficiently.
            </Typography>
            
            <Box display="flex" gap={2}>
              <Button 
                variant="contained" 
                size="large" 
                color="secondary" 
                endIcon={<ArrowForward />}
                onClick={() => navigate('/login')}
                sx={{ px: 5, py: 1.8, fontSize: '1rem', fontWeight: 'bold', borderRadius: 2 }}
              >
                Student Portal
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                onClick={() => navigate('/login')} // Assuming Supervisors login same place
                sx={{ px: 5, py: 1.8, fontSize: '1rem', color: '#ccd6f6', borderColor: '#ccd6f6', borderRadius: 2 }}
              >
                Faculty Login
              </Button>
            </Box>
            
            <Box sx={{ mt: 6, display: 'flex', gap: 4, color: '#8892b0' }}>
              {['Real-time Tracking', 'Digital Evaluations', 'Secure Archives'].map((text) => (
                <Box key={text} display="flex" alignItems="center" gap={1}>
                  <CheckCircle fontSize="small" color="secondary" />
                  <Typography variant="body2">{text}</Typography>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Right Visual (Glassmorphism Card) */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={24} 
              sx={{ 
                p: 5, 
                borderRadius: 4, 
                background: 'rgba(255, 255, 255, 0.03)', 
                backdropFilter: 'blur(20px)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            >
              <Typography variant="h6" gutterBottom color="secondary" fontWeight="bold">
                📢 Spring 2025 Updates
              </Typography>
              <Box sx={{ my: 3, p: 2, bgcolor: 'rgba(251, 140, 0, 0.1)', borderRadius: 2, borderLeft: '4px solid #fb8c00' }}>
                <Typography variant="subtitle2" sx={{ color: '#ffb74d' }}>Coordinator Message</Typography>
                <Typography variant="body2" sx={{ color: '#ccd6f6', mt: 1 }}>
                  "All groups must submit Log #01 by Friday. Ensure your project scope is approved before starting development."
                </Typography>
              </Box>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                {[
                  { label: "Active Projects", val: "142" },
                  { label: "Submissions", val: "850+" },
                  { label: "Next Deadline", val: "Oct 24" }
                ].map((stat, idx) => (
                  <Grid item xs={4} key={idx} textAlign="center">
                    {/* Value: Orange for high contrast and theme matching */}
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#fb8c00' }}>
                      {stat.val}
                    </Typography>
                    
                    {/* Label: White with slight opacity for hierarchy */}
                    <Typography variant="caption" sx={{ color: '#ffffff', opacity: 0.9 }}>
                      {stat.label}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Landing;