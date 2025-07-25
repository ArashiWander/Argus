import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Metrics from './pages/Metrics';
import Logs from './pages/Logs';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Security from './pages/Security';
import Tracing from './pages/Tracing';
import Auth from './pages/Auth';

const AppContent: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Navbar />
      <Box component="main" sx={{ p: 3 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/security" element={<Security />} />
          <Route path="/tracing" element={<Tracing />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;