import React, { useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { Container, TextField, Button, Typography, Box, Alert, Paper } from '@mui/material';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      dispatch(loginSuccess(res.data));

      // ✅ FIX
      localStorage.setItem("auth", JSON.stringify({
        token: res.data.token,
        user: res.data.user
      }));
      const role = res.data.user?.role || res.data.role;
      
      // --- FIX: Add Panelist Redirection Here ---
      if (role === 'student') navigate('/student-dashboard');
      else if (role === 'supervisor') navigate('/supervisor-dashboard');
      else if (role === 'coordinator') navigate('/coordinator-dashboard');
      else if (role === 'panelist') navigate('/panelist-dashboard'); // <--- NEW LINE
      else navigate('/');
      
    } catch (err) {
      setError('Invalid Email or Password');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
          AFMS Login
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Bahria University H-11 Campus
        </Typography>

        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField name="email"
            margin="normal" required fullWidth label="Email Address" autoFocus
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <TextField name="password"
            margin="normal" required fullWidth label="Password" type="password"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3, mb: 2 }}>
            Sign In
          </Button>
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Link to="/register" style={{ textDecoration: 'none', color: '#0a192f', fontWeight: 500 }}>
              Don't have an account? Register
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;