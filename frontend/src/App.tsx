import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Metrics from './pages/Metrics';
import Logs from './pages/Logs';

function App() {
  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <Navbar />
        <Box component="main" sx={{ p: 3 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/logs" element={<Logs />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;