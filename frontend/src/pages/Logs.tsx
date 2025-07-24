import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import { logsApi } from '../services/api';
import { LogEntry } from '../types';
import { format } from 'date-fns';

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // Filters
  const [levelFilter, setLevelFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // New log form
  const [newLog, setNewLog] = useState({
    level: 'info',
    message: '',
    service: '',
    tags: '{}'
  });

  const logLevels = ['debug', 'info', 'warn', 'error', 'fatal'];

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page,
        limit: pagination.limit
      };
      
      if (levelFilter) params.level = levelFilter;
      if (serviceFilter) params.service = serviceFilter;
      if (searchFilter) params.search = searchFilter;

      const response = await logsApi.getLogs(params);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [levelFilter, serviceFilter, searchFilter, pagination.limit]);

  const submitLog = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!newLog.message || !newLog.service) {
        setError('Please fill in message and service fields');
        return;
      }

      let tags = {};
      try {
        tags = JSON.parse(newLog.tags);
      } catch {
        setError('Invalid JSON format for tags');
        return;
      }

      await logsApi.submitLog({
        level: newLog.level,
        message: newLog.message,
        service: newLog.service,
        timestamp: new Date().toISOString(),
        tags
      });

      setSuccess('Log submitted successfully');
      setNewLog({ level: 'info', message: '', service: '', tags: '{}' });
      fetchLogs(1);
    } catch (err: any) {
      setError(err.message || 'Failed to submit log');
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [levelFilter, serviceFilter, searchFilter, fetchLogs]);

  const uniqueServices = Array.from(new Set(logs.map(log => log.service)));

  const getLogLevelColor = (level: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (level.toLowerCase()) {
      case 'debug':
        return 'default';
      case 'info':
        return 'info';
      case 'warn':
      case 'warning':
        return 'warning';
      case 'error':
      case 'fatal':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Logs
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Submit New Log */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Submit New Log
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Level</InputLabel>
                    <Select
                      value={newLog.level}
                      label="Level"
                      onChange={(e) => setNewLog({ ...newLog, level: e.target.value })}
                    >
                      {logLevels.map((level) => (
                        <MenuItem key={level} value={level}>
                          {level.toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Service *"
                    value={newLog.service}
                    onChange={(e) => setNewLog({ ...newLog, service: e.target.value })}
                    placeholder="web-server"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Message *"
                    value={newLog.message}
                    onChange={(e) => setNewLog({ ...newLog, message: e.target.value })}
                    placeholder="Application started successfully"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tags (JSON)"
                    value={newLog.tags}
                    onChange={(e) => setNewLog({ ...newLog, tags: e.target.value })}
                    placeholder='{"user_id": "123", "request_id": "abc-def"}'
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={submitLog}
                    fullWidth
                  >
                    Submit Log
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Filters */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filters & Search
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Level</InputLabel>
                    <Select
                      value={levelFilter}
                      label="Level"
                      onChange={(e) => setLevelFilter(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>All Levels</em>
                      </MenuItem>
                      {logLevels.map((level) => (
                        <MenuItem key={level} value={level}>
                          {level.toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Service</InputLabel>
                    <Select
                      value={serviceFilter}
                      label="Service"
                      onChange={(e) => setServiceFilter(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>All Services</em>
                      </MenuItem>
                      {uniqueServices.map((service) => (
                        <MenuItem key={service} value={service}>
                          {service}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Search"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search in messages..."
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Logs Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Recent Logs ({pagination.total})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Page {pagination.page} of {pagination.pages}
                </Typography>
              </Box>
              
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Timestamp</TableCell>
                          <TableCell>Level</TableCell>
                          <TableCell>Service</TableCell>
                          <TableCell>Message</TableCell>
                          <TableCell>Tags</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss.SSS')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={log.level.toUpperCase()} 
                                size="small" 
                                color={getLogLevelColor(log.level)}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip label={log.service} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  wordBreak: 'break-word',
                                  maxWidth: '400px',
                                  fontFamily: 'monospace',
                                  fontSize: '0.8rem'
                                }}
                              >
                                {log.message}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                                {Object.keys(log.tags).length > 0
                                  ? JSON.stringify(log.tags)
                                  : 'No tags'
                                }
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                        {logs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              <Typography color="text.secondary">
                                No logs found. Submit your first log above or adjust filters!
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {pagination.pages > 1 && (
                    <Box display="flex" justifyContent="center" mt={2}>
                      <Pagination
                        count={pagination.pages}
                        page={pagination.page}
                        onChange={(_, page) => fetchLogs(page)}
                        color="primary"
                      />
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Logs;