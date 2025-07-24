import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { metricsApi, logsApi } from '../services/api';
import { Metric, LogEntry } from '../types';
import { format, subHours, isAfter } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartData {
  labels: string[];
  datasets: any[];
}

const MetricsChart: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState(24); // hours
  const [selectedMetric, setSelectedMetric] = useState('');
  const [selectedService, setSelectedService] = useState('');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const start = subHours(new Date(), timeRange).toISOString();
      const params: any = { start };
      
      if (selectedService) params.service = selectedService;
      if (selectedMetric) params.metric_name = selectedMetric;

      const response = await metricsApi.getMetrics(params);
      setMetrics(response.data.metrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, selectedMetric, selectedService]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMetrics();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, selectedMetric, selectedService]);

  const uniqueServices = Array.from(new Set(metrics.map(m => m.service)));
  const uniqueMetricNames = Array.from(new Set(metrics.map(m => m.name)));

  const generateChartData = (): ChartData => {
    if (metrics.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Group metrics by time intervals (e.g., 5-minute buckets)
    const timeIntervalMs = 5 * 60 * 1000; // 5 minutes
    const now = new Date();
    const startTime = subHours(now, timeRange);
    
    const buckets = new Map<number, { sum: number; count: number; timestamp: Date }>();
    
    metrics.forEach(metric => {
      const timestamp = new Date(metric.timestamp);
      if (isAfter(timestamp, startTime)) {
        const bucketKey = Math.floor(timestamp.getTime() / timeIntervalMs) * timeIntervalMs;
        
        if (!buckets.has(bucketKey)) {
          buckets.set(bucketKey, { sum: 0, count: 0, timestamp: new Date(bucketKey) });
        }
        
        const bucket = buckets.get(bucketKey)!;
        bucket.sum += metric.value;
        bucket.count += 1;
      }
    });

    // Convert to chart data
    const sortedBuckets = Array.from(buckets.entries()).sort(([a], [b]) => a - b);
    
    const labels = sortedBuckets.map(([_, bucket]) => 
      format(bucket.timestamp, 'MMM dd HH:mm')
    );
    
    const data = sortedBuckets.map(([_, bucket]) => 
      bucket.count > 0 ? bucket.sum / bucket.count : 0
    );

    const metricName = selectedMetric || 'All Metrics';
    const serviceName = selectedService || 'All Services';

    return {
      labels,
      datasets: [
        {
          label: `${metricName} (${serviceName})`,
          data,
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Metrics Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    animation: {
      duration: 300,
    },
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Metrics Visualization</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchMetrics}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(Number(e.target.value))}
              >
                <MenuItem value={1}>Last Hour</MenuItem>
                <MenuItem value={6}>Last 6 Hours</MenuItem>
                <MenuItem value={24}>Last 24 Hours</MenuItem>
                <MenuItem value={168}>Last Week</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Service</InputLabel>
              <Select
                value={selectedService}
                label="Service"
                onChange={(e) => setSelectedService(e.target.value)}
              >
                <MenuItem value="">All Services</MenuItem>
                {uniqueServices.map((service) => (
                  <MenuItem key={service} value={service}>
                    {service}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Metric</InputLabel>
              <Select
                value={selectedMetric}
                label="Metric"
                onChange={(e) => setSelectedMetric(e.target.value)}
              >
                <MenuItem value="">All Metrics</MenuItem>
                {uniqueMetricNames.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box display="flex" alignItems="center" height="40px">
              <Chip 
                label={`${metrics.length} data points`} 
                color="primary" 
                variant="outlined" 
              />
            </Box>
          </Grid>
        </Grid>

        <Box height={300}>
          <Line data={generateChartData()} options={chartOptions} />
        </Box>
      </CardContent>
    </Card>
  );
};

const LogsChart: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState(24); // hours

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const start = subHours(new Date(), timeRange).toISOString();
      const response = await logsApi.getLogs({ start, limit: 1000 });
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const generateLogLevelChart = (): ChartData => {
    const levelCounts = logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
    const colors = {
      debug: '#9e9e9e',
      info: '#2196f3',
      warn: '#ff9800',
      error: '#f44336',
      fatal: '#9c27b0',
    };

    return {
      labels: levels.map(level => level.toUpperCase()),
      datasets: [
        {
          label: 'Log Count',
          data: levels.map(level => levelCounts[level] || 0),
          backgroundColor: levels.map(level => colors[level as keyof typeof colors]),
          borderColor: levels.map(level => colors[level as keyof typeof colors]),
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Log Level Distribution',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Log Analysis</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchLogs}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(Number(e.target.value))}
              >
                <MenuItem value={1}>Last Hour</MenuItem>
                <MenuItem value={6}>Last 6 Hours</MenuItem>
                <MenuItem value={24}>Last 24 Hours</MenuItem>
                <MenuItem value={168}>Last Week</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" height="40px">
              <Chip 
                label={`${logs.length} log entries`} 
                color="secondary" 
                variant="outlined" 
              />
            </Box>
          </Grid>
        </Grid>

        <Box height={250}>
          <Bar data={generateLogLevelChart()} options={chartOptions} />
        </Box>
      </CardContent>
    </Card>
  );
};

export { MetricsChart, LogsChart };