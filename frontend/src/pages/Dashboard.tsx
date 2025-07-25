import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Typography,
  Box,
  Alert,
  Fade,
  Chip,

} from '@mui/material';
import { 
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  BugReport as BugReportIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,

} from '@mui/icons-material';
import { healthApi, metricsApi, logsApi, alertsApi } from '../services/api';
import { HealthStatus } from '../types';
import { MetricsChart, LogsChart } from '../components/Charts';
import { StatCard, MetricCard, StatusCard } from '../components/ui/Cards';
import { DashboardSkeleton } from '../components/ui/Skeletons';
import { useCommonNotifications } from '../components/NotificationSystem';


const Dashboard: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metricsStats, setMetricsStats] = useState<any>(null);
  const [logsStats, setLogsStats] = useState<any>(null);
  const [alertStats, setAlertStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notifyConnectionError, notifyPlatformStatus } = useCommonNotifications();

  const fetchDashboardData = useCallback(async () => {
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
  }, [notifyConnectionError, notifyPlatformStatus]);

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) {
    return <DashboardSkeleton />;

  }

  if (error) {
    return (
      <Fade in>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4,
            borderRadius: 3,
            '& .MuiAlert-message': {
              fontSize: '0.9rem',
              fontWeight: 500,
            },
          }}
        >
          {error}
        </Alert>
      </Fade>


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
      {/* Header Section */}
      <Fade in timeout={300}>
        <Box mb={5}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              mb: 1,
            }}
          >
            Dashboard
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ 
              fontWeight: 400,
              fontSize: '1.1rem',
              mb: 3,
            }}
          >
            Real-time monitoring and observability platform
          </Typography>
          
          {/* Status Pills */}
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip
              icon={<SpeedIcon />}
              label={health ? `System ${health.message}` : 'System Status'}
              color={health ? getStatusColor(health.message) : 'default'}
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
            <Chip
              icon={<StorageIcon />}
              label={`${metricsStats?.total_metrics || 0} Metrics`}
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
            <Chip
              icon={<BugReportIcon />}
              label={`${logsStats?.total_logs || 0} Log Entries`}
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          </Box>
        </Box>
      </Fade>


      <Grid container spacing={4}>
        {/* Key Metrics Row */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="System Health"
            value={health?.message || 'Unknown'}
            subtitle={health ? `Uptime: ${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : ''}
            icon={SpeedIcon}
            color="primary"
            delay={0}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Metrics"
            value={metricsStats?.total_metrics || 0}
            subtitle={`${metricsStats?.unique_services || 0} services monitored`}
            icon={TimelineIcon}
            color="info"
            trend={{ value: 12, isPositive: true }}
            delay={1}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Log Entries"
            value={logsStats?.total_logs || 0}
            subtitle={`${logsStats?.unique_services || 0} services logging`}
            icon={StorageIcon}
            color="success"
            trend={{ value: 8, isPositive: true }}
            delay={2}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Active Alerts"
            value={alertStats?.active_alerts || 0}
            subtitle={`${alertStats?.enabled_rules || 0} rules configured`}
            icon={NotificationsIcon}
            color={alertStats?.active_alerts > 0 ? 'error' : 'success'}
            delay={3}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatusCard
            title="Services Status"
            status={health?.message === 'healthy' ? 'healthy' : 'warning'}
            message={health?.message}
            details={health ? Object.entries(health.services).map(([service, status]) => ({
              label: service.charAt(0).toUpperCase() + service.slice(1),
              value: status as string,
              status: status as string,
            })) : []}
            delay={4}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Security Events"
            value="0"
            subtitle="No threats detected"
            icon={SecurityIcon}
            color="success"
            delay={5}
          />
        </Grid>

        {/* Charts Section */}
        <Grid item xs={12}>
          <MetricCard
            title="Real-time Metrics"
            delay={6}
            action={
              <Chip
                label="Live"
                color="success"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            }
          >
            <MetricsChart />
          </MetricCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          <MetricCard
            title="Log Analysis"
            delay={7}
          >
            <LogsChart />
          </MetricCard>
        </Grid>

        {/* Log Level Distribution */}
        {logsStats && logsStats.level_distribution && (
          <Grid item xs={12} lg={6}>
            <MetricCard
              title="Log Level Distribution"
              delay={8}
            >
              <Grid container spacing={3}>
                {Object.entries(logsStats.level_distribution).map(([level, count]) => (
                  <Grid item xs={6} sm={3} key={level}>
                    <Box textAlign="center">
                      <Typography 
                        variant="h4" 
                        color={
                          level === 'error' ? 'error.main' :
                          level === 'warn' ? 'warning.main' :
                          level === 'info' ? 'info.main' : 'success.main'
                        }
                        fontWeight={700}
                      >
                        {count as number}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          textTransform: 'uppercase',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {level}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </MetricCard>
          </Grid>
        )}

        {/* Alert Statistics */}
        {alertStats && alertStats.alerts_by_severity && (
          <Grid item xs={12} lg={6}>
            <MetricCard
              title="Alert Severity Breakdown"
              delay={9}
            >
              <Grid container spacing={3}>
                {Object.entries(alertStats.alerts_by_severity).map(([severity, count]) => (
                  <Grid item xs={6} sm={3} key={severity}>
                    <Box textAlign="center">
                      <Typography 
                        variant="h4" 
                        color={
                          severity === 'critical' ? 'error.main' : 
                          severity === 'high' ? 'warning.main' : 
                          severity === 'medium' ? 'info.main' : 'success.main'
                        }
                        fontWeight={700}
                      >
                        {count as number}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          textTransform: 'uppercase',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {severity}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </MetricCard>
          </Grid>
        )}

        {/* Quick Actions */}
        <Grid item xs={12} lg={6}>
          <MetricCard
            title="Quick Actions"
            delay={10}
          >
            <Box sx={{ '& > *': { mb: 1.5 } }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main', 
                    mr: 2 
                  }} 
                />
                View real-time metrics in the Metrics tab
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    bgcolor: 'info.main', 
                    mr: 2 
                  }} 
                />
                Search and filter logs in the Logs tab
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    bgcolor: 'warning.main', 
                    mr: 2 
                  }} 
                />
                Manage alerts and alert rules in the Alerts tab
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    bgcolor: 'success.main', 
                    mr: 2 
                  }} 
                />
                Submit custom metrics via API
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    bgcolor: 'secondary.main', 
                    mr: 2 
                  }} 
                />
                Configure notification channels for alerts
              </Typography>
            </Box>
          </MetricCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;