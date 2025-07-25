import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  CircularProgress,
  Alert as MuiAlert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  AccountTree as AccountTreeIcon,
  Speed as SpeedIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { format, subHours } from 'date-fns';
import { tracingApi } from '../services/api';
import { TraceData, ServiceDependency } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tracing-tabpanel-${index}`}
      aria-labelledby={`tracing-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Tracing: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [traces, setTraces] = useState<TraceData[]>([]);
  const [dependencies, setDependencies] = useState<ServiceDependency[]>([]);
  const [tracingStats, setTracingStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<TraceData | null>(null);
  const [traceDialogOpen, setTraceDialogOpen] = useState(false);
  
  // Filters
  const [serviceFilter, setServiceFilter] = useState('');
  const [operationFilter, setOperationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [timeRange, setTimeRange] = useState(24); // hours

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceFilter, operationFilter, statusFilter, timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const start = subHours(new Date(), timeRange).toISOString();
      const traceParams: any = { start, limit: 100 };
      
      if (serviceFilter) traceParams.service = serviceFilter;
      if (operationFilter) traceParams.operation = operationFilter;
      if (statusFilter) traceParams.status = statusFilter;

      const [tracesResponse, dependenciesResponse, statsResponse] = await Promise.all([
        tracingApi.getTraces(traceParams),
        tracingApi.getServiceDependencies(),
        tracingApi.getTracingStats(),
      ]);

      setTraces(tracesResponse.data.traces);
      setDependencies(dependenciesResponse.data.dependencies);
      setTracingStats(statsResponse.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tracing data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewTrace = async (traceId: string) => {
    try {
      const response = await tracingApi.getTrace(traceId);
      setSelectedTrace(response.data.trace);
      setTraceDialogOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trace details');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'timeout':
        return <ScheduleIcon color="warning" />;
      default:
        return <CheckCircleIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'success';
      case 'error':
        return 'error';
      case 'timeout':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDuration = (durationMs: number) => {
    if (durationMs < 1000) {
      return `${Math.round(durationMs)}ms`;
    } else if (durationMs < 60000) {
      return `${(durationMs / 1000).toFixed(2)}s`;
    } else {
      return `${(durationMs / 60000).toFixed(2)}m`;
    }
  };

  const uniqueServices = Array.from(new Set(traces.map(trace => trace.services).flat()));
  const uniqueOperations = Array.from(new Set(traces.map(trace => trace.root_operation)));

  if (loading && traces.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Distributed Tracing
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor request flows across services and identify performance bottlenecks
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <MuiAlert severity="error" sx={{ mb: 2 }}>
          {error}
        </MuiAlert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TimelineIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Traces</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {tracingStats?.total_traces || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In last {timeRange} hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountTreeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Services</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {tracingStats?.unique_services || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monitored services
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Error Rate</Typography>
              </Box>
              <Typography variant="h4" color={tracingStats?.error_rate > 5 ? 'error' : 'primary'}>
                {tracingStats?.error_rate?.toFixed(1) || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed traces
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Avg Duration</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {formatDuration(tracingStats?.avg_duration_ms || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average trace time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="tracing tabs">
          <Tab label="Traces" />
          <Tab label="Service Dependencies" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Service</InputLabel>
              <Select
                value={serviceFilter}
                label="Service"
                onChange={(e) => setServiceFilter(e.target.value)}
              >
                <MenuItem value="">All Services</MenuItem>
                {uniqueServices.map(service => (
                  <MenuItem key={service} value={service}>{service}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Operation</InputLabel>
              <Select
                value={operationFilter}
                label="Operation"
                onChange={(e) => setOperationFilter(e.target.value)}
              >
                <MenuItem value="">All Operations</MenuItem>
                {uniqueOperations.map(operation => (
                  <MenuItem key={operation} value={operation}>{operation}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="ok">OK</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="timeout">Timeout</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value as number)}
              >
                <MenuItem value={1}>Last Hour</MenuItem>
                <MenuItem value={6}>Last 6 Hours</MenuItem>
                <MenuItem value={24}>Last 24 Hours</MenuItem>
                <MenuItem value={168}>Last Week</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Traces Table */}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Trace ID</TableCell>
                <TableCell>Root Service</TableCell>
                <TableCell>Operation</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Spans</TableCell>
                <TableCell>Services</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {traces.map((trace) => (
                <TableRow key={trace.trace_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {trace.trace_id.substring(0, 16)}...
                    </Typography>
                  </TableCell>
                  <TableCell>{trace.root_service}</TableCell>
                  <TableCell>{trace.root_operation}</TableCell>
                  <TableCell>{formatDuration(trace.duration_ms)}</TableCell>
                  <TableCell>{trace.spans.length}</TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {trace.services.slice(0, 3).map(service => (
                        <Chip key={service} label={service} size="small" />
                      ))}
                      {trace.services.length > 3 && (
                        <Chip label={`+${trace.services.length - 3}`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(trace.status)}
                      label={trace.status.toUpperCase()}
                      color={getStatusColor(trace.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(trace.start_time), 'MMM dd, HH:mm:ss')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Trace Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewTrace(trace.trace_id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {traces.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No traces found for the selected criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Service Dependencies */}
        <Typography variant="h6" gutterBottom>
          Service Dependencies
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Visualize how services communicate with each other
        </Typography>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Caller Service</TableCell>
                <TableCell>Callee Service</TableCell>
                <TableCell>Operation</TableCell>
                <TableCell>Call Count</TableCell>
                <TableCell>Error Count</TableCell>
                <TableCell>Error Rate</TableCell>
                <TableCell>Avg Duration</TableCell>
                <TableCell>Last Called</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dependencies.map((dep, index) => {
                const errorRate = dep.call_count > 0 ? (dep.error_count / dep.call_count) * 100 : 0;
                return (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Chip label={dep.caller_service} color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={dep.callee_service} color="secondary" variant="outlined" />
                    </TableCell>
                    <TableCell>{dep.operation}</TableCell>
                    <TableCell>{dep.call_count}</TableCell>
                    <TableCell>{dep.error_count}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={errorRate > 10 ? 'error' : errorRate > 5 ? 'warning' : 'inherit'}
                      >
                        {errorRate.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDuration(dep.avg_duration_ms)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(dep.last_called), 'MMM dd, HH:mm:ss')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {dependencies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No service dependencies found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Trace Details Dialog */}
      <Dialog
        open={traceDialogOpen}
        onClose={() => setTraceDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Trace Details
          {selectedTrace && (
            <Typography variant="subtitle2" color="text.secondary">
              {selectedTrace.trace_id}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedTrace && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
                  <Typography variant="body1">{formatDuration(selectedTrace.duration_ms)}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">Spans</Typography>
                  <Typography variant="body1">{selectedTrace.spans.length}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">Services</Typography>
                  <Typography variant="body1">{selectedTrace.services.length}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={selectedTrace.status.toUpperCase()} 
                    color={getStatusColor(selectedTrace.status) as any} 
                    size="small"
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>Spans</Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell>Operation</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Start Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedTrace.spans.map((span) => (
                      <TableRow key={span.id}>
                        <TableCell>{span.service_name}</TableCell>
                        <TableCell>{span.operation_name}</TableCell>
                        <TableCell>{span.duration_ms ? formatDuration(span.duration_ms) : 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(span.status)}
                            label={span.status.toUpperCase()}
                            color={getStatusColor(span.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {format(new Date(span.start_time), 'HH:mm:ss.SSS')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTraceDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tracing;