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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Gavel as AuditIcon,
  Shield as ComplianceIcon,
  Warning as ThreatIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Visibility as ViewIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../services/api';

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
      id={`security-tabpanel-${index}`}
      aria-labelledby={`security-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Security: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [securityData, setSecurityData] = useState<any>(null);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [auditTrails, setAuditTrails] = useState<any[]>([]);
  const [threatRules, setThreatRules] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [complianceForm, setComplianceForm] = useState({
    framework: 'SOC2',
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  const [complianceReport, setComplianceReport] = useState<any>(null);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardResponse, eventsResponse, alertsResponse, auditResponse, rulesResponse] = await Promise.all([
        api.get('/security/dashboard'),
        api.get('/security/events'),
        api.get('/security/alerts'),
        api.get('/security/audit'),
        api.get('/security/threats/rules'),
      ]);

      setSecurityData(dashboardResponse.data);
      setSecurityEvents(eventsResponse.data.events || []);
      setSecurityAlerts(alertsResponse.data.alerts || []);
      setAuditTrails(auditResponse.data.audit_trails || []);
      setThreatRules(rulesResponse.data.rules || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
      case 'high': return <ThreatIcon />;
      case 'medium': return <InfoIcon />;
      case 'low': return <CheckCircleIcon />;
      default: return <SecurityIcon />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'success': return 'success';
      case 'failure': return 'error';
      case 'blocked': return 'warning';
      default: return 'default';
    }
  };

  const generateComplianceReport = async () => {
    setLoading(true);
    try {
      const response = await api.post('/security/compliance/report', complianceForm);
      setComplianceReport(response.data.compliance_report);
      alert('Compliance report generated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate compliance report');
    } finally {
      setLoading(false);
    }
  };

  const evaluateThreats = async () => {
    setLoading(true);
    try {
      const response = await api.post('/security/threats/evaluate');
      await loadSecurityData(); // Refresh data
      alert(`Threat evaluation completed. ${response.data.count} alerts generated.`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to evaluate threats');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon fontSize="large" />
          Security Monitoring & Compliance
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="security tabs">
            <Tab icon={<SecurityIcon />} label="Security Overview" />
            <Tab icon={<ThreatIcon />} label="Threat Detection" />
            <Tab icon={<AuditIcon />} label="Audit Trail" />
            <Tab icon={<ComplianceIcon />} label="Compliance" />
          </Tabs>
        </Box>

        {/* Security Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Summary Cards */}
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
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Threat Rules
                      </Typography>
                      <Typography variant="h4">
                        {threatRules.filter(r => r.enabled).length}
                      </Typography>
                      <Typography color="textSecondary">
                        of {threatRules.length} Total
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}

            {/* Event Trends */}
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

            {/* Event Outcomes */}
            {securityData?.event_trends && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Event Outcomes" />
                  <CardContent>
                    <Bar
                      data={{
                        labels: Object.keys(securityData.event_trends.by_outcome),
                        datasets: [{
                          label: 'Count',
                          data: Object.values(securityData.event_trends.by_outcome),
                          backgroundColor: ['#4BC0C0', '#FF6384', '#FFCE56'],
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

            {/* Recent Security Events */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Recent Security Events" />
                <CardContent>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>Action</TableCell>
                          <TableCell>User</TableCell>
                          <TableCell>Source IP</TableCell>
                          <TableCell>Outcome</TableCell>
                          <TableCell>Risk Score</TableCell>
                          <TableCell>Timestamp</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {securityEvents.slice(0, 10).map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>{event.event_type}</TableCell>
                            <TableCell>{event.action}</TableCell>
                            <TableCell>{event.username || '-'}</TableCell>
                            <TableCell>{event.source_ip || '-'}</TableCell>
                            <TableCell>
                              <Chip
                                label={event.outcome}
                                color={getOutcomeColor(event.outcome) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{event.risk_score}</TableCell>
                            <TableCell>{formatTimestamp(event.timestamp)}</TableCell>
                            <TableCell>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => setSelectedEvent(event)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Threat Detection Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            {/* Threat Controls */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Threat Detection Controls" />
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Button
                        variant="contained"
                        onClick={evaluateThreats}
                        disabled={loading}
                        startIcon={<ThreatIcon />}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Evaluate Threats'}
                      </Button>
                    </Grid>
                    <Grid item>
                      <Typography variant="body2" color="textSecondary">
                        Manually trigger threat detection evaluation
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Active Security Alerts */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Security Alerts" />
                <CardContent>
                  {securityAlerts.length === 0 ? (
                    <Typography>No security alerts</Typography>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Rule</TableCell>
                            <TableCell>Threat Type</TableCell>
                            <TableCell>Severity</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Risk Score</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Created</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {securityAlerts.map((alert) => (
                            <TableRow key={alert.id}>
                              <TableCell>{alert.rule_name}</TableCell>
                              <TableCell>{alert.threat_type}</TableCell>
                              <TableCell>
                                <Chip
                                  icon={getSeverityIcon(alert.severity)}
                                  label={alert.severity}
                                  color={getSeverityColor(alert.severity) as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{alert.description}</TableCell>
                              <TableCell>{alert.risk_score}</TableCell>
                              <TableCell>
                                <Chip label={alert.status} size="small" />
                              </TableCell>
                              <TableCell>{formatTimestamp(alert.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Threat Detection Rules */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Threat Detection Rules" />
                <CardContent>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Severity</TableCell>
                          <TableCell>Enabled</TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {threatRules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell>{rule.name}</TableCell>
                            <TableCell>{rule.rule_type}</TableCell>
                            <TableCell>
                              <Chip
                                icon={getSeverityIcon(rule.severity)}
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
                            <TableCell>{rule.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Audit Trail Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Audit Trail" />
                <CardContent>
                  {auditTrails.length === 0 ? (
                    <Typography>No audit trail entries</Typography>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Resource</TableCell>
                            <TableCell>Outcome</TableCell>
                            <TableCell>IP Address</TableCell>
                            <TableCell>Timestamp</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {auditTrails.slice(0, 20).map((trail) => (
                            <TableRow key={trail.id}>
                              <TableCell>{trail.username || trail.user_id || '-'}</TableCell>
                              <TableCell>{trail.action}</TableCell>
                              <TableCell>{trail.resource}</TableCell>
                              <TableCell>
                                <Chip
                                  label={trail.outcome}
                                  color={getOutcomeColor(trail.outcome) as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{trail.ip_address || '-'}</TableCell>
                              <TableCell>{formatTimestamp(trail.timestamp)}</TableCell>
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

        {/* Compliance Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Generate Compliance Report" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Compliance Framework</InputLabel>
                        <Select
                          value={complianceForm.framework}
                          label="Compliance Framework"
                          onChange={(e) => setComplianceForm(prev => ({ ...prev, framework: e.target.value }))}
                        >
                          <MenuItem value="SOX">SOX</MenuItem>
                          <MenuItem value="GDPR">GDPR</MenuItem>
                          <MenuItem value="HIPAA">HIPAA</MenuItem>
                          <MenuItem value="PCI_DSS">PCI DSS</MenuItem>
                          <MenuItem value="SOC2">SOC2</MenuItem>
                          <MenuItem value="ISO27001">ISO 27001</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Start Date"
                        value={complianceForm.start_date}
                        onChange={(e) => setComplianceForm(prev => ({ ...prev, start_date: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="End Date"
                        value={complianceForm.end_date}
                        onChange={(e) => setComplianceForm(prev => ({ ...prev, end_date: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={generateComplianceReport}
                        disabled={loading}
                        startIcon={<ReportIcon />}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Generate Report'}
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Compliance Report Display */}
            {complianceReport && (
              <Grid item xs={12}>
                <Card>
                  <CardHeader 
                    title={`Compliance Report - ${complianceReport.compliance_framework}`}
                    subheader={`Period: ${complianceReport.period_start} to ${complianceReport.period_end}`}
                  />
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Overall Compliance Score: {complianceReport.overall_compliance_score}%
                    </Typography>
                    
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Findings:
                    </Typography>
                    {complianceReport.findings.map((finding: any, index: number) => (
                      <Card key={index} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ flex: 1 }}>
                              {finding.requirement}
                            </Typography>
                            <Chip
                              label={finding.status.replace('_', ' ')}
                              color={finding.status === 'compliant' ? 'success' : 
                                     finding.status === 'non_compliant' ? 'error' : 'warning'}
                              size="small"
                            />
                          </Box>
                          {finding.evidence && finding.evidence.length > 0 && (
                            <>
                              <Typography variant="body2" gutterBottom>
                                <strong>Evidence:</strong>
                              </Typography>
                              <ul>
                                {finding.evidence.map((evidence: string, i: number) => (
                                  <li key={i}>
                                    <Typography variant="body2">{evidence}</Typography>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                          {finding.recommendations && finding.recommendations.length > 0 && (
                            <>
                              <Typography variant="body2" gutterBottom>
                                <strong>Recommendations:</strong>
                              </Typography>
                              <ul>
                                {finding.recommendations.map((rec: string, i: number) => (
                                  <li key={i}>
                                    <Typography variant="body2">{rec}</Typography>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </Box>

      {/* Security Event Details Dialog */}
      <Dialog
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedEvent && (
          <>
            <DialogTitle>Security Event Details</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Event Type:</Typography>
                  <Typography variant="body1">{selectedEvent.event_type}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Action:</Typography>
                  <Typography variant="body1">{selectedEvent.action}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Severity:</Typography>
                  <Chip
                    icon={getSeverityIcon(selectedEvent.severity)}
                    label={selectedEvent.severity}
                    color={getSeverityColor(selectedEvent.severity) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Risk Score:</Typography>
                  <Typography variant="body1">{selectedEvent.risk_score}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">User:</Typography>
                  <Typography variant="body1">{selectedEvent.username || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Source IP:</Typography>
                  <Typography variant="body1">{selectedEvent.source_ip || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Details:</Typography>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                    {JSON.stringify(selectedEvent.details, null, 2)}
                  </pre>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedEvent(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default Security;