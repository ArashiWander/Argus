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
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { metricsApi } from '../services/api';
import { Metric } from '../types';
import { format } from 'date-fns';

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
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Metrics
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchMetrics}
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
        {/* Submit New Metric */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Submit New Metric
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Metric Name *"
                    value={newMetric.name}
                    onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
                    placeholder="cpu.usage"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Value *"
                    type="number"
                    value={newMetric.value}
                    onChange={(e) => setNewMetric({ ...newMetric, value: e.target.value })}
                    placeholder="75.5"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Service *"
                    value={newMetric.service}
                    onChange={(e) => setNewMetric({ ...newMetric, service: e.target.value })}
                    placeholder="web-server"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tags (JSON)"
                    value={newMetric.tags}
                    onChange={(e) => setNewMetric({ ...newMetric, tags: e.target.value })}
                    placeholder='{"host": "server-1", "region": "us-east-1"}'
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={submitMetric}
                    fullWidth
                  >
                    Submit Metric
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
                Filters
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Metric Name"
                    value={metricNameFilter}
                    onChange={(e) => setMetricNameFilter(e.target.value)}
                    placeholder="cpu.usage"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Metrics Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Metrics ({metrics.length})
              </Typography>
              
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell>Tags</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.map((metric) => (
                        <TableRow key={metric.id}>
                          <TableCell>
                            {format(new Date(metric.timestamp), 'MMM dd, HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {metric.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {metric.value}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={metric.service} size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                              {Object.keys(metric.tags).length > 0
                                ? JSON.stringify(metric.tags)
                                : 'No tags'
                              }
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      {metrics.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary">
                              No metrics found. Submit your first metric above!
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Metrics;