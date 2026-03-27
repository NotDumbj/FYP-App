import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Container, TextField, Button, Typography, Box, MenuItem, Alert 
} from '@mui/material';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    buid: '',
    email: '',
    password: '',
    role: 'student' // Default role
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Connect to the Backend Register API
      await axios.post('http://localhost:5000/api/auth/register', formData);
      alert('Registration Successful! Please Login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration Failed');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Create AFMS Account</Typography>
        
        {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            name="fullName" label="Full Name" required fullWidth margin="normal"
            onChange={handleChange}
          />
          <TextField
            name="buid" label="University ID (e.g., 01-131232-062)" required fullWidth margin="normal"
            onChange={handleChange}
          />
          <TextField
            name="email" label="Email Address" type="email" required fullWidth margin="normal"
            onChange={handleChange}
          />
          <TextField
            name="password" label="Password" type="password" required fullWidth margin="normal"
            onChange={handleChange}
          />
          
          <TextField
            select
            name="role"
            label="Select Role"
            value={formData.role}
            onChange={handleChange}
            fullWidth
            margin="normal"
          >
            <MenuItem value="student">Student</MenuItem>
            <MenuItem value="coordinator">Coordinator</MenuItem>
            <MenuItem value="supervisor">Supervisor</MenuItem>
            <MenuItem value="panelist">Panelist</MenuItem>
          </TextField>

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Register
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Link to="/login" style={{ textDecoration: 'none', color: '#1976d2' }}>
              Already have an account? Sign In
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;