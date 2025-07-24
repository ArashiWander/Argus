import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  AutoFixHigh as AIIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Insights as InsightsIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import api from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [securityData, setSecurityData] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // AI Analytics Form State
  const [detectForm, setDetectForm] = useState({
    metric_name: 'cpu.usage',
    service: '',
    lookback_hours: 24,
  });

  const [predictForm, setPredictForm] = useState({
    metric_name: 'cpu.usage',
    service: '',
    horizon_hours: 24,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsResponse, securityResponse, anomaliesResponse, insightsResponse] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/security/dashboard'),
        api.get('/analytics/anomalies?status=active'),
        api.get('/analytics/insights'),
      ]);

      setAnalyticsData(analyticsResponse.data);
      setSecurityData(securityResponse.data);
      setAnomalies(anomaliesResponse.data.anomalies || []);
      setInsights(insightsResponse.data.insights || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const detectAnomalies = async () => {
    setLoading(true);
    try {
      const response = await api.post('/analytics/anomalies/detect', detectForm);
      setAnomalies(response.data.anomalies);
      alert(`Detected ${response.data.count} anomalies`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to detect anomalies');
    } finally {
      setLoading(false);
    }
  };

  const generatePrediction = async () => {
    setLoading(true);
    try {
      const response = await api.post('/analytics/predictions', predictForm);
      setPredictions(prev => [...prev, response.data.prediction]);
      alert('Prediction generated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    setLoading(true);
    try {
      const response = await api.post('/analytics/insights/generate');
      setInsights(response.data.insights);
      alert(`Generated ${response.data.count} insights`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate insights');
    } finally {
      setLoading(false);
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
      case 'medium': return <TrendingUpIcon />;
      case 'low': return <CheckCircleIcon />;
      default: return <InsightsIcon />;
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PsychologyIcon fontSize="large" />
          AI Analytics & Intelligence
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
            <Tab icon={<AIIcon />} label="AI Analytics" />
            <Tab icon={<SecurityIcon />} label="Security Intelligence" />
            <Tab icon={<InsightsIcon />} label="Performance Insights" />
            <Tab icon={<TrendingUpIcon />} label="Predictive Analysis" />
          </Tabs>
        </Box>

        {/* AI Analytics Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Summary Cards */}
            {analyticsData && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Active Anomalies
                      </Typography>
                      <Typography variant="h4">
                        {analyticsData.summary?.active_anomalies || 0}
                      </Typography>
                      <Typography color="error">
                        {analyticsData.summary?.critical_anomalies || 0} Critical
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        AI Insights
                      </Typography>
                      <Typography variant="h4">
                        {analyticsData.summary?.total_insights || 0}
                      </Typography>
                      <Typography color="warning.main">
                        {analyticsData.summary?.critical_insights || 0} Critical
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}

            {/* Anomaly Detection Controls */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Anomaly Detection" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Metric Name"
                        value={detectForm.metric_name}
                        onChange={(e) => setDetectForm(prev => ({ ...prev, metric_name: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Service (optional)"
                        value={detectForm.service}
                        onChange={(e) => setDetectForm(prev => ({ ...prev, service: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Lookback Hours"
                        value={detectForm.lookback_hours}
                        onChange={(e) => setDetectForm(prev => ({ ...prev, lookback_hours: parseInt(e.target.value) }))}
                        inputProps={{ min: 1, max: 168 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={detectAnomalies}
                        disabled={loading}
                        sx={{ height: '56px' }}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Detect Anomalies'}
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Insights Generation */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Performance Insights" />
                <CardContent>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Generate AI-powered performance insights and optimization recommendations.
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={generateInsights}
                    disabled={loading}
                    startIcon={<InsightsIcon />}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Generate Insights'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Anomalies */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Recent Anomalies" />
                <CardContent>
                  {anomalies.length === 0 ? (
                    <Typography>No anomalies detected</Typography>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Metric</TableCell>
                            <TableCell>Service</TableCell>
                            <TableCell>Expected</TableCell>
                            <TableCell>Actual</TableCell>
                            <TableCell>Score</TableCell>
                            <TableCell>Severity</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {anomalies.slice(0, 10).map((anomaly) => (
                            <TableRow key={anomaly.id}>
                              <TableCell>{anomaly.metric_name}</TableCell>
                              <TableCell>{anomaly.service || '-'}</TableCell>
                              <TableCell>{anomaly.expected_value.toFixed(2)}</TableCell>
                              <TableCell>{anomaly.actual_value.toFixed(2)}</TableCell>
                              <TableCell>{anomaly.anomaly_score.toFixed(2)}</TableCell>
                              <TableCell>
                                <Chip
                                  icon={getSeverityIcon(anomaly.severity)}
                                  label={anomaly.severity}
                                  color={getSeverityColor(anomaly.severity) as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip label={anomaly.status} size="small" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Intelligence Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            {securityData && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Security Events (24h)
                      </Typography>
                      <Typography variant="h4">
                        {securityData.summary?.security_events_24h || 0}
                      </Typography>
                      <Typography color="error">
                        {securityData.summary?.failed_events_24h || 0} Failed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Active Alerts
                      </Typography>
                      <Typography variant="h4">
                        {securityData.summary?.active_alerts || 0}
                      </Typography>
                      <Typography color="error">
                        {securityData.summary?.critical_alerts || 0} Critical
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Audit Entries (24h)
                      </Typography>
                      <Typography variant="h4">
                        {securityData.summary?.audit_entries_24h || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}

            {/* Security Event Trends */}
            {securityData?.event_trends && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Security Event Types" />
                  <CardContent>
                    <Doughnut
                      data={{
                        labels: Object.keys(securityData.event_trends.by_type),
                        datasets: [{
                          data: Object.values(securityData.event_trends.by_type),
                          backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF',
                            '#FF9F40',
                          ],
                        }],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'right' },
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Threat Landscape */}
            {securityData?.threat_landscape && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Threat Landscape" />
                  <CardContent>
                    <Bar
                      data={{
                        labels: Object.keys(securityData.threat_landscape.by_threat_type),
                        datasets: [{
                          label: 'Threat Count',
                          data: Object.values(securityData.threat_landscape.by_threat_type),
                          backgroundColor: '#FF6384',
                        }],
                      }}
                      options={{
                        responsive: true,
                        scales: {
                          y: { beginAtZero: true },
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Performance Insights Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="AI-Generated Performance Insights" />
                <CardContent>
                  {insights.length === 0 ? (
                    <Typography>No insights available. Click "Generate Insights" to analyze performance.</Typography>
                  ) : (
                    insights.map((insight, index) => (
                      <Card key={insight.id} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {getSeverityIcon(insight.severity)}
                            <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
                              {insight.title}
                            </Typography>
                            <Chip 
                              label={insight.type} 
                              size="small" 
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              label={insight.severity}
                              color={getSeverityColor(insight.severity) as any}
                              size="small"
                            />
                          </Box>
                          <Typography variant="body2" color="textSecondary" paragraph>
                            {insight.description}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Affected Services:</strong> {insight.affected_services.join(', ')}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Confidence:</strong> {(insight.confidence_score * 100).toFixed(1)}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={insight.confidence_score * 100} 
                            sx={{ mt: 1, mb: 2 }}
                          />
                          <Typography variant="body2">
                            <strong>Recommended Actions:</strong>
                          </Typography>
                          <ul>
                            {insight.recommended_actions.map((action: string, i: number) => (
                              <li key={i}><Typography variant="body2">{action}</Typography></li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Predictive Analysis Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            {/* Prediction Controls */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Generate Prediction" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Metric Name"
                        value={predictForm.metric_name}
                        onChange={(e) => setPredictForm(prev => ({ ...prev, metric_name: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Service (optional)"
                        value={predictForm.service}
                        onChange={(e) => setPredictForm(prev => ({ ...prev, service: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Horizon Hours"
                        value={predictForm.horizon_hours}
                        onChange={(e) => setPredictForm(prev => ({ ...prev, horizon_hours: parseInt(e.target.value) }))}
                        inputProps={{ min: 1, max: 168 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={generatePrediction}
                        disabled={loading}
                        sx={{ height: '56px' }}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Generate Prediction'}
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Predictions Display */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Predictive Analysis Results" />
                <CardContent>
                  {predictions.length === 0 ? (
                    <Typography>No predictions generated yet</Typography>
                  ) : (
                    predictions.map((prediction, index) => (
                      <Card key={index} sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {prediction.metric_name} {prediction.service && `(${prediction.service})`}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" paragraph>
                            Model Accuracy: {(prediction.model_accuracy * 100).toFixed(1)}%
                          </Typography>
                          <Line
                            data={{
                              labels: prediction.predicted_values.map((p: any) => 
                                new Date(p.timestamp).toLocaleDateString()
                              ),
                              datasets: [
                                {
                                  label: 'Predicted Value',
                                  data: prediction.predicted_values.map((p: any) => p.predicted_value),
                                  borderColor: '#36A2EB',
                                  tension: 0.1,
                                },
                                {
                                  label: 'Upper Bound',
                                  data: prediction.predicted_values.map((p: any) => p.confidence_interval.upper),
                                  borderColor: '#FF6384',
                                  borderDash: [5, 5],
                                  fill: false,
                                },
                                {
                                  label: 'Lower Bound',
                                  data: prediction.predicted_values.map((p: any) => p.confidence_interval.lower),
                                  borderColor: '#FF6384',
                                  borderDash: [5, 5],
                                  fill: false,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              scales: {
                                y: { beginAtZero: true },
                              },
                            }}
                          />
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </Container>
  );
};

export default Analytics;