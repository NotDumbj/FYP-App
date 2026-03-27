import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, 
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem, Badge 
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AddCircle as AddIcon,
  Schedule as ScheduleIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Notifications as BellIcon
} from '@mui/icons-material';

const drawerWidth = 260;

const Layout = () => {
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  
  // Menu State
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl); 

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [anchorNotif, setAnchorNotif] = useState(null);
  const openNotif = Boolean(anchorNotif);

  // Poll for notifications
  useEffect(() => {
    if(user && token) {
      // Mock data for demo
      setNotifications([
        { id: 1, message: "Welcome to the new semester!" },
        { id: 2, message: "Upload Log #12 by Friday." }
      ]);
    }
  }, [user, token]);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNotifMenu = (event) => setAnchorNotif(event.currentTarget);
  const handleNotifClose = () => setAnchorNotif(null);

  const handleLogout = () => {
    handleClose();
    dispatch(logout());
    navigate('/login');
  };

  const handleProfile = () => {
    handleClose();
    alert("Profile Page Coming Soon"); 
  };

  // Role-Based Navigation Config
  const getMenu = () => {
    const role = user?.role;
    
    if (role === 'student') {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/student-dashboard' },
        { text: 'New Proposal', icon: <AddIcon />, path: '/submit-proposal' },
      ];
    } else if (role === 'supervisor') {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/supervisor-dashboard' },
      ];
    } else if (role === 'coordinator') {
      return [
        { text: 'Overview', icon: <DashboardIcon />, path: '/coordinator-dashboard' },
        { text: 'Auto-Schedule', icon: <ScheduleIcon />, path: '/schedule-defense' },
      ];
    } else if (role === 'panelist') {
      return [
        { text: 'Committee Console', icon: <DashboardIcon />, path: '/panelist-dashboard' },
      ];
    }
    return [];
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top Navigation Bar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            AFMS | Bahria University
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Notification Bell */}
            <IconButton color="inherit" onClick={handleNotifMenu}>
              <Badge badgeContent={notifications.length} color="error">
                <BellIcon />
              </Badge>
            </IconButton>

            {/* Notification Dropdown */}
            <Menu
              anchorEl={anchorNotif}
              open={openNotif}
              onClose={handleNotifClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {notifications.length === 0 ? (
                <MenuItem>No new notifications</MenuItem>
              ) : (
                notifications.map((notif) => (
                  <MenuItem key={notif.id} onClick={handleNotifClose} sx={{ maxWidth: 300, whiteSpace: 'normal' }}>
                    <Typography variant="body2">{notif.message}</Typography>
                  </MenuItem>
                ))
              )}
            </Menu>

            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.name} ({user?.role?.toUpperCase()})
            </Typography>
            
            <IconButton onClick={handleMenu} color="inherit">
              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                {user?.name?.charAt(0)}
              </Avatar>
            </IconButton>

            <Menu 
              anchorEl={anchorEl} 
              open={open} 
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleProfile}>
                <ListItemIcon><PersonIcon fontSize="small"/></ListItemIcon> Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><LogoutIcon fontSize="small"/></ListItemIcon> Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Side Navigation Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar /> 
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {getMenu().map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{ 
                    borderRadius: '0 20px 20px 0', 
                    mr: 1,
                    '&.Mui-selected': { bgcolor: 'primary.light', color: 'white', '&:hover': { bgcolor: 'primary.main' } },
                    '&.Mui-selected .MuiListItemIcon-root': { color: 'white' }
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 4, 
          bgcolor: 'background.default', 
          minHeight: '100vh',
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8 
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;