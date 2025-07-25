import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Tooltip,
  IconButton,
} from '@mui/material';
import { 
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  BugReport as BugReportIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { healthApi, metricsApi, logsApi, alertsApi } from '../services/api';
import { HealthStatus } from '../types';
import { MetricsChart, LogsChart } from '../components/Charts';
import ErrorDisplay from '../components/ErrorDisplay';
import LoadingState, { EmptyState } from '../components/LoadingState';
import { useNotifications, useCommonNotifications } from '../components/NotificationSystem';

const Dashboard: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metricsStats, setMetricsStats] = useState<any>(null);
  const [logsStats, setLogsStats] = useState<any>(null);
  const [alertStats, setAlertStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notifyConnectionError, notifyPlatformStatus } = useCommonNotifications();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [healthResponse, metricsStatsResponse, logsStatsResponse, alertStatsResponse] = await Promise.all([
        healthApi.getHealth(),
        metricsApi.getStats(),
        logsApi.getStats(),
        alertsApi.getAlertStats().catch(() => ({ data: null })), // Don't fail if alerts not available
      ]);

      setHealth(healthResponse.data);
      setMetricsStats(metricsStatsResponse.data);
      setLogsStats(logsStatsResponse.data);
      setAlertStats(alertStatsResponse.data);
      
      // Provide user feedback about platform status
      notifyPlatformStatus(healthResponse.data.message === 'OK' || healthResponse.data.message === 'healthy');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch dashboard data';
      setError(errorMessage);
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        notifyConnectionError();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <LoadingState 
        type="card"
        context="dashboard"
        message="Loading dashboard data..."
        showTips={true}
      />
    );
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        context="dashboard loading"
        onRetry={fetchDashboardData}
        showTroubleshooting={true}
      />
    );
  }

  // Check if we have any data at all
  const hasData = health || metricsStats?.total_metrics > 0 || logsStats?.total_logs > 0;
  
  if (!hasData) {
    return (
      <EmptyState
        context="dashboard"
        actionButton={
          <Button variant="contained" onClick={fetchDashboardData} startIcon={<RefreshIcon />}>
            Refresh Dashboard
          </Button>
        }
        showSuggestions={true}
      />
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'OK':
        return 'success';
      case 'not_connected':
        return 'warning';
      default:
        return 'error';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Argus Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Real-time monitoring and observability platform
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh dashboard data">
            <IconButton onClick={fetchDashboardData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Need help? Click for guidance">
            <IconButton color="primary">
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* System Health */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">System Health</Typography>
              </Box>
              {health && (
                <>
                  <Chip 
                    label={health.message} 
                    color={getStatusColor(health.message)}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Uptime: {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Version: {health.version}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Metrics Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TimelineIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Metrics</Typography>
              </Box>
              {metricsStats && (
                <>
                  <Typography variant="h4" color="primary">
                    {metricsStats.total_metrics}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total metrics collected
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Services: {metricsStats.unique_services}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Logs Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Logs</Typography>
              </Box>
              {logsStats && (
                <>
                  <Typography variant="h4" color="primary">
                    {logsStats.total_logs}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total log entries
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Services: {logsStats.unique_services}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Services Status */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BugReportIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Services</Typography>
              </Box>
              {health && (
                <Box>
                  {Object.entries(health.services).map(([service, status]) => (
                    <Box key={service} display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {service}:
                      </Typography>
                      <Chip 
                        label={status} 
                        size="small"
                        color={getStatusColor(status)}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Alert Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <NotificationsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Alerts</Typography>
              </Box>
              {alertStats && (
                <>
                  <Typography variant="h4" color={alertStats.active_alerts > 0 ? 'error' : 'primary'}>
                    {alertStats.active_alerts || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active alerts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rules: {alertStats.enabled_rules || 0}
                  </Typography>
                </>
              )}
              {!alertStats && (
                <>
                  <Typography variant="h4" color="primary">
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active alerts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Alert system ready
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Metrics Visualization */}
        <Grid item xs={12}>
          <MetricsChart />
        </Grid>

        {/* Log Analysis */}
        <Grid item xs={12} lg={6}>
          <LogsChart />
        </Grid>

        {/* Log Level Distribution */}
        {logsStats && logsStats.level_distribution && (
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Log Level Summary
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(logsStats.level_distribution).map(([level, count]) => (
                    <Grid item xs={6} sm={3} key={level}>
                      <Box textAlign="center">
                        <Typography variant="h5" color="primary">
                          {count as number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                          {level}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Alert Statistics */}
        {alertStats && alertStats.alerts_by_severity && (
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alert Severity Summary
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(alertStats.alerts_by_severity).map(([severity, count]) => (
                    <Grid item xs={6} sm={3} key={severity}>
                      <Box textAlign="center">
                        <Typography variant="h5" color={
                          severity === 'critical' ? 'error.main' : 
                          severity === 'high' ? 'warning.main' : 
                          severity === 'medium' ? 'info.main' : 'success.main'
                        }>
                          {count as number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                          {severity}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • View real-time metrics in the Metrics tab
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Search and filter logs in the Logs tab
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Manage alerts and alert rules in the Alerts tab
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Submit custom metrics via API
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Configure notification channels for alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;