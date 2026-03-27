import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing'; 
import StudentDashboard from './pages/StudentDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import PanelistDashboard from './pages/PanelistDashboard'; // Import the new dashboard
import SubmitProposal from './pages/SubmitProposal';
import ScheduleDefense from './pages/ScheduleDefense';
import EvaluationPanel from './pages/EvaluationPanel'; 
import Layout from './components/Layout';
import ProjectDetails from './pages/ProjectDetails';

const PrivateRoute = ({ children, roles }) => {
  const { user, token } = useSelector((state) => state.auth);

  if (token === null) return null; // prevent flicker

  if (!token) return <Navigate to="/login" />;

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes (Wrapped in Layout) */}
        <Route element={<Layout />}>
          
          {/* STUDENT ROUTES */}
          <Route 
            path="/student-dashboard" 
            element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} 
          />
          <Route 
            path="/submit-proposal" 
            element={<PrivateRoute roles={['student']}><SubmitProposal /></PrivateRoute>} 
          />
          
          {/* SUPERVISOR ROUTES */}
          <Route 
            path="/supervisor-dashboard" 
            element={<PrivateRoute roles={['supervisor']}><SupervisorDashboard /></PrivateRoute>} 
          />
          
          {/* COORDINATOR ROUTES */}
          <Route 
            path="/coordinator-dashboard" 
            element={<PrivateRoute roles={['coordinator']}><CoordinatorDashboard /></PrivateRoute>} 
          />
          <Route 
            path="/schedule-defense" 
            element={<PrivateRoute roles={['coordinator']}><ScheduleDefense /></PrivateRoute>} 
          />

          {/* PANELIST ROUTES (New) */}
          <Route 
            path="/panelist-dashboard" 
            element={<PrivateRoute roles={['panelist']}><PanelistDashboard /></PrivateRoute>} 
          />

          <Route 
            path="/evaluation" 
            element={<PrivateRoute roles={['panelist']}><EvaluationPanel /></PrivateRoute>} 
          />
          
          {/* PROJECT HUB (Shared Access - Ensure panelist is included) */}
          <Route 
            path="/projects/:id" 
            element={<PrivateRoute roles={['student', 'supervisor', 'coordinator', 'panelist']}><ProjectDetails /></PrivateRoute>} 
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;