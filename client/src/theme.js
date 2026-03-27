import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#0a192f', light: '#172a46' },
    secondary: { main: '#fb8c00' },
    background: { default: '#f0f2f5', paper: '#ffffff' }, // Slightly darker grey for contrast
  },
  shape: {
    borderRadius: 12, // Consistent rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 24px', // Bigger formal buttons
          boxShadow: 'none',
          '&:hover': { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove dark mode gradient if applied
          boxShadow: '0px 2px 12px rgba(0,0,0,0.06)', // Soft shadow
          border: '1px solid rgba(0,0,0,0.03)',
        },
      },
    },
  },
});

export default theme;