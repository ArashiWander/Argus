import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { Box, CircularProgress, Container } from '@mui/material';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useCommonNotifications } from './components/NotificationSystem';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Metrics from './pages/Metrics';
import Logs from './pages/Logs';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Security from './pages/Security';
import Auth from './pages/Auth';
import HelpSystem from './components/HelpSystem';
import WelcomeExperience from './components/WelcomeExperience';

// Enhanced theme with better accessibility
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // More readable button text
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.875rem', // Better readability
        },
      },
    },
  },
});

const AppContent: React.FC = () => {
  const { loading } = useAuth();
  const { notifyFirstRun } = useCommonNotifications();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Check if this is the user's first visit
    const hasSeenWelcome = localStorage.getItem('argus-welcome-seen');
    
    if (!hasSeenWelcome && !loading) {
      setShowWelcome(true);
      localStorage.setItem('argus-welcome-seen', 'true');
      notifyFirstRun();
    }
  }, [loading, notifyFirstRun]);

  const handleWelcomeClose = () => {
    setShowWelcome(false);
  };

  const handleStartTour = () => {
    setShowTour(true);
  };

  const handleTourComplete = () => {
    setShowTour(false);
  };

  if (loading) {
    return (

      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
        sx={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        }}
      >
        <Box textAlign="center">
          <CircularProgress size={48} thickness={4} />
          <Box mt={2} color="text.secondary" fontSize="0.875rem" fontWeight={500}>
            Loading Argus Platform...
          </Box>
        </Box>
      </Box>

    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: 'background.default',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Navbar />

      <Box 
        component="main" 
        sx={{ 
          flex: 1,
          py: 4,
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 0, sm: 2 } }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/security" element={<Security />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </Container>

      </Box>

      {/* User Experience Enhancements */}
      <HelpSystem showTour={showTour} onTourComplete={handleTourComplete} />
      
      <WelcomeExperience
        open={showWelcome}
        onClose={handleWelcomeClose}
        onStartTour={handleStartTour}
      />
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;