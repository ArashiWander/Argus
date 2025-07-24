import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  Alert as MuiAlert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { alertsApi } from '../services/api';
import { AlertRule, Alert, NotificationChannel } from '../types';
import { useAuth } from '../contexts/AuthContext';

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
      id={`alerts-tabpanel-${index}`}
      aria-labelledby={`alerts-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Alerts: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  
  // State for alerts
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  
  // Form states
  const [ruleForm, setRuleForm] = useState<{
    name: string;
    description: string;
    metric_name: string;
    service: string;
    condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
    threshold: number;
    duration_minutes: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    notification_channels: string[];
    enabled: boolean;
  }>({
    name: '',
    description: '',
    metric_name: '',
    service: '',
    condition: 'greater_than',
    threshold: 0,
    duration_minutes: 5,
    severity: 'medium',
    notification_channels: [],
    enabled: true,
  });

  const [channelForm, setChannelForm] = useState<{
    name: string;
    type: 'email' | 'webhook' | 'slack';
    config: any;
  }>({
    name: '',
    type: 'email',
    config: {},
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography variant="h6" color="text.secondary">
          Please log in to access the alerts system.
        </Typography>
      </Box>
    );
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [alertsResponse, rulesResponse, channelsResponse] = await Promise.all([
        alertsApi.getAlerts(),
        alertsApi.getAlertRules(),
        alertsApi.getNotificationChannels(),
      ]);

      setAlerts(alertsResponse.data.alerts);
      setAlertRules(rulesResponse.data.rules);
      setNotificationChannels(channelsResponse.data.channels);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch alert data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      await alertsApi.acknowledgeAlert(alertId);
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to acknowledge alert');
    }
  };

  const handleResolveAlert = async (alertId: number) => {
    try {
      await alertsApi.resolveAlert(alertId);
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to resolve alert');
    }
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setRuleForm({
      name: '',
      description: '',
      metric_name: '',
      service: '',
      condition: 'greater_than',
      threshold: 0,
      duration_minutes: 5,
      severity: 'medium',
      notification_channels: [],
      enabled: true,
    });
    setRuleDialogOpen(true);
  };

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description || '',
      metric_name: rule.metric_name,
      service: rule.service || '',
      condition: rule.condition,
      threshold: rule.threshold,
      duration_minutes: rule.duration_minutes,
      severity: rule.severity,
      notification_channels: rule.notification_channels,
      enabled: rule.enabled,
    });
    setRuleDialogOpen(true);
  };

  const handleSaveRule = async () => {
    try {
      if (editingRule) {
        await alertsApi.updateAlertRule(editingRule.id, ruleForm);
      } else {
        await alertsApi.createAlertRule(ruleForm);
      }
      setRuleDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save alert rule');
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (window.confirm('Are you sure you want to delete this alert rule?')) {
      try {
        await alertsApi.deleteAlertRule(ruleId);
        fetchData();
      } catch (err: any) {
        setError(err.message || 'Failed to delete alert rule');
      }
    }
  };

  const handleCreateChannel = () => {
    setChannelForm({
      name: '',
      type: 'email',
      config: {},
    });
    setChannelDialogOpen(true);
  };

  const handleSaveChannel = async () => {
    try {
      let config = channelForm.config;
      
      // Set default config based on type
      if (channelForm.type === 'email' && !config.recipients) {
        config = { recipients: ['admin@example.com'] };
      } else if (channelForm.type === 'webhook' && !config.url) {
        config = { url: 'https://example.com/webhook' };
      } else if (channelForm.type === 'slack' && !config.webhook_url) {
        config = { webhook_url: 'https://hooks.slack.com/services/...' };
      }

      await alertsApi.createNotificationChannel({
        ...channelForm,
        config,
        enabled: true,
      });
      setChannelDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create notification channel');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon />;
      case 'high': return <WarningIcon />;
      case 'medium': return <InfoIcon />;
      case 'low': return <InfoIcon />;
      default: return <InfoIcon />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Alert Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <MuiAlert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </MuiAlert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label={`Active Alerts (${alerts.filter(a => a.status === 'active').length})`} />
          <Tab label={`Alert Rules (${alertRules.length})`} />
          <Tab label={`Notification Channels (${notificationChannels.length})`} />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          {alerts.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" align="center">
                    No alerts found
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            alerts.map((alert) => (
              <Grid item xs={12} key={alert.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" mb={1}>
                          {getSeverityIcon(alert.severity)}
                          <Typography variant="h6" sx={{ ml: 1 }}>
                            {alert.rule_name}
                          </Typography>
                          <Chip
                            label={alert.severity}
                            color={getSeverityColor(alert.severity) as any}
                            size="small"
                            sx={{ ml: 2 }}
                          />
                          <Chip
                            label={alert.status}
                            variant={alert.status === 'active' ? 'filled' : 'outlined'}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          {alert.message}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Service: {alert.service || 'N/A'} | 
                          Metric: {alert.metric_name} | 
                          Current Value: {alert.current_value} | 
                          Threshold: {alert.threshold}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Triggered: {new Date(alert.triggered_at).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        {alert.status === 'active' && (
                          <>
                            <Tooltip title="Acknowledge Alert">
                              <IconButton
                                size="small"
                                onClick={() => handleAcknowledgeAlert(alert.id)}
                                sx={{ mr: 1 }}
                              >
                                <CheckIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Resolve Alert">
                              <IconButton
                                size="small"
                                onClick={() => handleResolveAlert(alert.id)}
                                color="primary"
                              >
                                <CloseIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Alert Rules</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateRule}
          >
            Create Rule
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Metric</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Threshold</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alertRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {rule.name}
                    </Typography>
                    {rule.description && (
                      <Typography variant="caption" color="text.secondary">
                        {rule.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {rule.metric_name}
                    {rule.service && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Service: {rule.service}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{rule.condition.replace('_', ' ')}</TableCell>
                  <TableCell>{rule.threshold}</TableCell>
                  <TableCell>
                    <Chip
                      label={rule.severity}
                      color={getSeverityColor(rule.severity) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.enabled ? 'Enabled' : 'Disabled'}
                      color={rule.enabled ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit Rule">
                      <IconButton
                        size="small"
                        onClick={() => handleEditRule(rule)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Rule">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRule(rule.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Notification Channels</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateChannel}
          >
            Create Channel
          </Button>
        </Box>

        <Grid container spacing={2}>
          {notificationChannels.map((channel) => (
            <Grid item xs={12} md={6} lg={4} key={channel.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {channel.name}
                  </Typography>
                  <Chip
                    label={channel.type}
                    color="primary"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Chip
                    label={channel.enabled ? 'Enabled' : 'Disabled'}
                    color={channel.enabled ? 'success' : 'default'}
                    size="small"
                    sx={{ ml: 1, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(channel.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Alert Rule Dialog */}
      <Dialog open={ruleDialogOpen} onClose={() => setRuleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rule Name"
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Metric Name"
                value={ruleForm.metric_name}
                onChange={(e) => setRuleForm({ ...ruleForm, metric_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Service (optional)"
                value={ruleForm.service}
                onChange={(e) => setRuleForm({ ...ruleForm, service: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={ruleForm.condition}
                  label="Condition"
                  onChange={(e) => setRuleForm({ ...ruleForm, condition: e.target.value as any })}
                >
                  <MenuItem value="greater_than">Greater Than</MenuItem>
                  <MenuItem value="less_than">Less Than</MenuItem>
                  <MenuItem value="equals">Equals</MenuItem>
                  <MenuItem value="not_equals">Not Equals</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Threshold"
                type="number"
                value={ruleForm.threshold}
                onChange={(e) => setRuleForm({ ...ruleForm, threshold: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={ruleForm.duration_minutes}
                onChange={(e) => setRuleForm({ ...ruleForm, duration_minutes: parseInt(e.target.value) || 1 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={ruleForm.severity}
                  label="Severity"
                  onChange={(e) => setRuleForm({ ...ruleForm, severity: e.target.value as any })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={ruleForm.enabled}
                    onChange={(e) => setRuleForm({ ...ruleForm, enabled: e.target.checked })}
                  />
                }
                label="Enabled"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveRule} variant="contained">
            {editingRule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Channel Dialog */}
      <Dialog open={channelDialogOpen} onClose={() => setChannelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Notification Channel</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Channel Name"
                value={channelForm.name}
                onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Channel Type</InputLabel>
                <Select
                  value={channelForm.type}
                  label="Channel Type"
                  onChange={(e) => setChannelForm({ ...channelForm, type: e.target.value as any })}
                >
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="webhook">Webhook</MenuItem>
                  <MenuItem value="slack">Slack</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChannelDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveChannel} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Alerts;