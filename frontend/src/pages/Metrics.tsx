import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
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
  Fade,
  Grow,
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { metricsApi } from '../services/api';
import { Metric } from '../types';
import { format } from 'date-fns';
import { MetricCard } from '../components/ui/Cards';
import { TableSkeleton } from '../components/ui/Skeletons';

const Metrics: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [serviceFilter, setServiceFilter] = useState('');
  const [metricNameFilter, setMetricNameFilter] = useState('');

  // New metric form
  const [newMetric, setNewMetric] = useState({
    name: '',
    value: '',
    service: '',
    tags: '{}'
  });

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (serviceFilter) params.service = serviceFilter;
      if (metricNameFilter) params.metric_name = metricNameFilter;

      const response = await metricsApi.getMetrics(params);
      setMetrics(response.data.metrics);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, [serviceFilter, metricNameFilter]);

  const submitMetric = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!newMetric.name || !newMetric.value || !newMetric.service) {
        setError('Please fill in all required fields');
        return;
      }

      let tags = {};
      try {
        tags = JSON.parse(newMetric.tags);
      } catch {
        setError('Invalid JSON format for tags');
        return;
      }

      await metricsApi.submitMetric({
        name: newMetric.name,
        value: parseFloat(newMetric.value),
        service: newMetric.service,
        timestamp: new Date().toISOString(),
        tags
      });

      setSuccess('Metric submitted successfully');
      setNewMetric({ name: '', value: '', service: '', tags: '{}' });
      fetchMetrics();
    } catch (err: any) {
      setError(err.message || 'Failed to submit metric');
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [serviceFilter, metricNameFilter, fetchMetrics]);

  const uniqueServices = Array.from(new Set(metrics.map(m => m.service)));

  return (
    <Box>
      {/* Header Section */}
      <Fade in timeout={300}>
        <Box mb={5}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  mb: 1,
                }}
              >
                Metrics
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ fontWeight: 400, fontSize: '1.1rem' }}
              >
                Monitor and submit custom metrics for your applications
              </Typography>
            </Box>
            
            <Tooltip title="Refresh metrics data">
              <IconButton
                color="primary"
                onClick={fetchMetrics}
                disabled={loading}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'scale(1.05)',
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabled',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Status Pills */}
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip
              icon={<TimelineIcon />}
              label={`${metrics.length} Total Metrics`}
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
            <Chip
              icon={<FilterIcon />}
              label={`${uniqueServices.length} Services`}
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
            {serviceFilter && (
              <Chip
                label={`Filtered by: ${serviceFilter}`}
                color="primary"
                size="small"
                onDelete={() => setServiceFilter('')}
              />
            )}
          </Box>
        </Box>
      </Fade>

      {error && (
        <Fade in>
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              '& .MuiAlert-message': {
                fontSize: '0.9rem',
                fontWeight: 500,
              },
            }} 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        </Fade>
      )}

      {success && (
        <Fade in>
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              '& .MuiAlert-message': {
                fontSize: '0.9rem',
                fontWeight: 500,
              },
            }} 
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        </Fade>
      )}

      <Grid container spacing={4}>
        {/* Submit New Metric */}
        <Grid item xs={12} lg={6}>
          <Grow in timeout={400}>
            <div>
              <MetricCard
                title="Submit New Metric"
                action={
                  <Chip
                    icon={<AddIcon />}
                    label="Create"
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                }
              >
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Metric Name"
                      value={newMetric.name}
                      onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
                      placeholder="cpu.usage"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Value"
                      type="number"
                      value={newMetric.value}
                      onChange={(e) => setNewMetric({ ...newMetric, value: e.target.value })}
                      placeholder="75.5"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Service"
                      value={newMetric.service}
                      onChange={(e) => setNewMetric({ ...newMetric, service: e.target.value })}
                      placeholder="web-server"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Tags (JSON)"
                      value={newMetric.tags}
                      onChange={(e) => setNewMetric({ ...newMetric, tags: e.target.value })}
                      placeholder='{"host": "server-1"}'
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={submitMetric}
                      fullWidth
                      size="large"
                      sx={{
                        borderRadius: 2,
                        py: 1.5,
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                        },
                      }}
                    >
                      Submit Metric
                    </Button>
                  </Grid>
                </Grid>
              </MetricCard>
            </div>
          </Grow>
        </Grid>

        {/* Filters */}
        <Grid item xs={12} lg={6}>
          <Grow in timeout={500}>
            <div>
              <MetricCard
                title="Filter Metrics"
                action={
                  <Chip
                    icon={<FilterIcon />}
                    label="Filter"
                    color="secondary"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                }
              >
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Service</InputLabel>
                      <Select
                        value={serviceFilter}
                        label="Service"
                        onChange={(e) => setServiceFilter(e.target.value)}
                        sx={{
                          borderRadius: 2,
                        }}
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
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Metric Name"
                      value={metricNameFilter}
                      onChange={(e) => setMetricNameFilter(e.target.value)}
                      placeholder="cpu.usage"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 6, 
                            height: 6, 
                            borderRadius: '50%', 
                            bgcolor: 'primary.main', 
                            mr: 1 
                          }} 
                        />
                        Filter by service or metric name
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </MetricCard>
            </div>
          </Grow>
        </Grid>

        {/* Metrics Table */}
        <Grid item xs={12}>
          <Grow in timeout={600}>
            <div>
              <MetricCard
                title={`Recent Metrics (${metrics.length})`}
                action={
                  loading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Chip
                      label="Live Data"
                      color="success"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  )
                }
              >
                {loading ? (
                  <TableSkeleton rows={10} />
                ) : (
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                      maxHeight: 600, 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Timestamp</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Value</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Service</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Tags</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {metrics.map((metric, index) => (
                          <Fade in timeout={300 + (index * 50)} key={metric.id}>
                            <TableRow 
                              sx={{
                                '&:hover': {
                                  bgcolor: 'action.hover',
                                },
                                transition: 'background-color 0.2s ease-in-out',
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {format(new Date(metric.timestamp), 'MMM dd, HH:mm:ss')}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography 
                                  variant="body2" 
                                  fontFamily="monospace"
                                  sx={{ 
                                    bgcolor: 'action.hover',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  {metric.name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography 
                                  variant="h6" 
                                  color="primary.main"
                                  fontWeight={600}
                                  fontSize="1rem"
                                >
                                  {metric.value}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={metric.service} 
                                  size="small" 
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ fontWeight: 500 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography 
                                  variant="body2" 
                                  fontFamily="monospace" 
                                  fontSize="0.75rem"
                                  color="text.secondary"
                                >
                                  {Object.keys(metric.tags).length > 0
                                    ? JSON.stringify(metric.tags)
                                    : '—'
                                  }
                                </Typography>
                              </TableCell>
                            </TableRow>
                          </Fade>
                        ))}
                        {metrics.length === 0 && !loading && (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                              <Box textAlign="center">
                                <TimelineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                  No metrics found
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Submit your first metric using the form above!
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </MetricCard>
            </div>
          </Grow>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Metrics;