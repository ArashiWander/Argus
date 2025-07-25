import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fab,
  Tooltip,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Help as HelpIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Timeline as MetricsIcon,
  Storage as LogsIcon,
  Notifications as AlertsIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

interface HelpSystemProps {
  showTour?: boolean;
  onTourComplete?: () => void;
}

const HelpSystem: React.FC<HelpSystemProps> = ({ showTour = false, onTourComplete }) => {
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(showTour);
  const [activeStep, setActiveStep] = useState(0);

  const tourSteps = [
    {
      title: '🎉 Welcome to Argus!',
      content: (
        <Box>
          <Typography variant="body1" gutterBottom>
            Welcome to the Argus Monitoring Platform! This quick tour will help you get started with monitoring your infrastructure and applications.
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Pro Tip:</strong> You can always access this tour again by clicking the help button (?) in the bottom right corner.
            </Typography>
          </Alert>
        </Box>
      ),
    },
    {
      title: '📊 Dashboard Overview',
      content: (
        <Box>
          <Typography variant="body1" gutterBottom>
            The Dashboard gives you a real-time overview of your entire system:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
              <ListItemText primary="System health status and uptime" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Metrics and logs statistics" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Service status monitoring" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Quick actions and navigation" />
            </ListItem>
          </List>
        </Box>
      ),
    },
    {
      title: '📈 Metrics Monitoring',
      content: (
        <Box>
          <Typography variant="body1" gutterBottom>
            The Metrics tab lets you visualize and analyze performance data:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><MetricsIcon color="primary" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Real-time charts and graphs" />
            </ListItem>
            <ListItem>
              <ListItemIcon><MetricsIcon color="primary" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Filter by service or metric name" />
            </ListItem>
            <ListItem>
              <ListItemIcon><MetricsIcon color="primary" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Historical trend analysis" />
            </ListItem>
          </List>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Getting Started:</strong> Run <code>./argus demo</code> in your terminal to generate sample metrics data.
            </Typography>
          </Alert>
        </Box>
      ),
    },
    {
      title: '📝 Logs Analysis',
      content: (
        <Box>
          <Typography variant="body1" gutterBottom>
            The Logs tab provides powerful log search and analysis:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><LogsIcon color="primary" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Search logs by message content" />
            </ListItem>
            <ListItem>
              <ListItemIcon><LogsIcon color="primary" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Filter by log level (error, warn, info, debug)" />
            </ListItem>
            <ListItem>
              <ListItemIcon><LogsIcon color="primary" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Filter by service name" />
            </ListItem>
            <ListItem>
              <ListItemIcon><LogsIcon color="primary" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Time range filtering" />
            </ListItem>
          </List>
        </Box>
      ),
    },
    {
      title: '🔔 Alerts & Notifications',
      content: (
        <Box>
          <Typography variant="body1" gutterBottom>
            Set up intelligent alerts to be notified of issues before they impact users:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><AlertsIcon color="primary" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Create custom alert rules" />
            </ListItem>
            <ListItem>
              <ListItemIcon><AlertsIcon color="primary" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Multiple notification channels" />
            </ListItem>
            <ListItem>
              <ListItemIcon><AlertsIcon color="primary" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Alert history and escalation" />
            </ListItem>
          </List>
        </Box>
      ),
    },
    {
      title: '🚀 Next Steps',
      content: (
        <Box>
          <Typography variant="body1" gutterBottom>
            You're ready to start monitoring! Here are some recommended next steps:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><PlayIcon color="success" fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Generate sample data" 
                secondary="Run: ./argus demo" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><PlayIcon color="success" fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Submit your first metric" 
                secondary="Run: ./argus submit-metric" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><PlayIcon color="success" fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Check the API documentation" 
                secondary="See README.md for API examples" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><PlayIcon color="success" fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Explore all tabs" 
                secondary="Discover Analytics and Security features" 
              />
            </ListItem>
          </List>
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Remember:</strong> Need help? Click the help button (?) anytime or check the comprehensive documentation in README.md
            </Typography>
          </Alert>
        </Box>
      ),
    },
  ];

  const quickHelpItems = [
    {
      icon: <DashboardIcon />,
      title: 'Dashboard',
      description: 'Real-time overview of system health, metrics, and logs',
    },
    {
      icon: <MetricsIcon />,
      title: 'Metrics',
      description: 'Performance monitoring with charts and analytics',
    },
    {
      icon: <LogsIcon />,
      title: 'Logs',
      description: 'Search and analyze log entries across services',
    },
    {
      icon: <AlertsIcon />,
      title: 'Alerts',
      description: 'Configure notifications for system issues',
    },
    {
      icon: <AnalyticsIcon />,
      title: 'Analytics',
      description: 'Advanced insights and trend analysis',
    },
    {
      icon: <SecurityIcon />,
      title: 'Security',
      description: 'Security monitoring and threat detection',
    },
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleTourFinish = () => {
    setTourOpen(false);
    setActiveStep(0);
    if (onTourComplete) {
      onTourComplete();
    }
  };

  const handleTourStart = () => {
    setHelpOpen(false);
    setTourOpen(true);
    setActiveStep(0);
  };

  return (
    <>
      {/* Help FAB */}
      <Tooltip title="Help & Tutorial">
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
          onClick={() => setHelpOpen(true)}
        >
          <HelpIcon />
        </Fab>
      </Tooltip>

      {/* Quick Help Dialog */}
      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Argus Help Center</Typography>
            <IconButton onClick={() => setHelpOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box mb={3}>
            <Alert severity="info">
              <Typography variant="body2">
                Welcome to Argus! Use this help center to quickly understand the platform features 
                or take the interactive tour to get started.
              </Typography>
            </Alert>
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Platform Features
          </Typography>
          
          <List>
            {quickHelpItems.map((item, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {React.cloneElement(item.icon, { color: 'primary' })}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  secondary={item.description}
                />
              </ListItem>
            ))}
          </List>

          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Quick Commands
            </Typography>
            <Typography variant="body2" component="div">
              <Box component="code" sx={{ backgroundColor: 'grey.100', p: 1, borderRadius: 1, display: 'block', mb: 1 }}>
                ./argus status  # Check platform status
              </Box>
              <Box component="code" sx={{ backgroundColor: 'grey.100', p: 1, borderRadius: 1, display: 'block', mb: 1 }}>
                ./argus demo    # Generate sample data
              </Box>
              <Box component="code" sx={{ backgroundColor: 'grey.100', p: 1, borderRadius: 1, display: 'block', mb: 1 }}>
                ./argus logs error  # View error logs
              </Box>
              <Box component="code" sx={{ backgroundColor: 'grey.100', p: 1, borderRadius: 1, display: 'block' }}>
                ./argus help    # See all commands
              </Box>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)}>
            Close
          </Button>
          <Button variant="contained" onClick={handleTourStart}>
            Take Interactive Tour
          </Button>
        </DialogActions>
      </Dialog>

      {/* Interactive Tour Dialog */}
      <Dialog
        open={tourOpen}
        onClose={handleTourFinish}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Argus Platform Tour</Typography>
            <IconButton onClick={handleTourFinish}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {tourSteps.map((step, index) => (
              <Step key={index}>
                <StepLabel>
                  <Typography variant="h6">{step.title}</Typography>
                </StepLabel>
                <StepContent>
                  {step.content}
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={index === tourSteps.length - 1 ? handleTourFinish : handleNext}
                      sx={{ mr: 1 }}
                    >
                      {index === tourSteps.length - 1 ? 'Finish Tour' : 'Next'}
                    </Button>
                    {index > 0 && (
                      <Button onClick={handleBack}>
                        Back
                      </Button>
                    )}
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HelpSystem;