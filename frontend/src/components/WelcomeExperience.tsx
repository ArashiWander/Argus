import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Visibility as ArgusIcon,
  Rocket as RocketIcon,
  CheckCircle as CheckIcon,
  Speed as DashboardIcon,
  Timeline as MetricsIcon,
  Storage as LogsIcon,
  Notifications as AlertsIcon,
  Code as ApiIcon,
  Computer as CliIcon,
} from '@mui/icons-material';

interface WelcomeExperienceProps {
  open: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

const WelcomeExperience: React.FC<WelcomeExperienceProps> = ({ open, onClose, onStartTour }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open) {
      // Simulate setup progress animation
      const timer = setTimeout(() => {
        setProgress(100);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const features = [
    {
      icon: <DashboardIcon color="primary" />,
      title: 'Real-time Dashboard',
      description: 'Monitor your infrastructure with live charts and metrics',
    },
    {
      icon: <MetricsIcon color="primary" />,
      title: 'Metrics Collection',
      description: 'Collect and visualize performance data from all your services',
    },
    {
      icon: <LogsIcon color="primary" />,
      title: 'Log Analysis',
      description: 'Search, filter, and analyze logs across your entire stack',
    },
    {
      icon: <AlertsIcon color="primary" />,
      title: 'Intelligent Alerts',
      description: 'Set up smart notifications to catch issues before users do',
    },
    {
      icon: <ApiIcon color="primary" />,
      title: 'Multi-Protocol API',
      description: 'REST, gRPC, MQTT, and Kafka support for any use case',
    },
    {
      icon: <CliIcon color="primary" />,
      title: 'Developer Tools',
      description: 'Powerful CLI tools and interactive setup wizards',
    },
  ];

  const quickStartSteps = [
    {
      title: 'Generate Sample Data',
      description: 'See Argus in action with realistic demo data',
      command: './argus demo',
      color: 'success' as const,
    },
    {
      title: 'Submit Your First Metric',
      description: 'Try the interactive metric submission tool',
      command: './argus submit-metric',
      color: 'primary' as const,
    },
    {
      title: 'Check Platform Status',
      description: 'Verify everything is running properly',
      command: './argus status',
      color: 'info' as const,
    },
    {
      title: 'Explore the API',
      description: 'See the comprehensive API documentation in README.md',
      command: 'Open README.md',
      color: 'secondary' as const,
    },
  ];

  const WelcomeStep = () => (
    <Box textAlign="center">
      <ArgusIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
      <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
        Welcome to Argus!
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Your comprehensive monitoring and observability platform
      </Typography>
      
      <Box sx={{ my: 3 }}>
        <Typography variant="body1" gutterBottom>
          Setting up your monitoring environment...
        </Typography>
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 2, height: 8, borderRadius: 4 }} />
      </Box>

      {progress === 100 && (
        <Alert severity="success" sx={{ mt: 3, mb: 3 }}>
          <Box display="flex" alignItems="center">
            <CheckIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              Great! Argus is ready to start monitoring your infrastructure.
            </Typography>
          </Box>
        </Alert>
      )}
    </Box>
  );

  const FeaturesStep = () => (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom textAlign="center" fontWeight="bold">
        🚀 What makes Argus powerful?
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" gutterBottom sx={{ mb: 3 }}>
        Discover the comprehensive monitoring capabilities at your fingertips
      </Typography>
      
      <Grid container spacing={2}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="flex-start" gap={2}>
                  <Box flexShrink={0}>
                    {feature.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const QuickStartStep = () => (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom textAlign="center" fontWeight="bold">
        ⚡ Quick Start Guide
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" gutterBottom sx={{ mb: 3 }}>
        Get started in minutes with these simple commands
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Pro Tip:</strong> Open a terminal in your Argus directory and run these commands to get started quickly.
        </Typography>
      </Alert>

      <List>
        {quickStartSteps.map((step, index) => (
          <React.Fragment key={index}>
            <ListItem sx={{ py: 2 }}>
              <ListItemIcon>
                <Chip 
                  label={index + 1} 
                  size="small" 
                  color={step.color}
                  sx={{ minWidth: 32 }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="h6">{step.title}</Typography>
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {step.description}
                    </Typography>
                    <Box 
                      component="code" 
                      sx={{ 
                        backgroundColor: 'grey.100', 
                        p: 1, 
                        borderRadius: 1, 
                        display: 'inline-block',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                      }}
                    >
                      {step.command}
                    </Box>
                  </Box>
                }
              />
            </ListItem>
            {index < quickStartSteps.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>

      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Ready to explore?</strong> Take the interactive tour to learn about each feature in detail.
        </Typography>
      </Alert>
    </Box>
  );

  const steps = [
    { component: WelcomeStep, title: 'Welcome' },
    { component: FeaturesStep, title: 'Features' },
    { component: QuickStartStep, title: 'Quick Start' },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartTour = () => {
    onClose();
    onStartTour();
  };

  const handleSkip = () => {
    onClose();
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '600px',
          borderRadius: 2,
        },
      }}
    >
      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <Box flexGrow={1}>
            <CurrentStepComponent />
          </Box>
          
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            sx={{ pt: 3, mt: 'auto' }}
          >
            <Box display="flex" gap={1}>
              {steps.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: index === currentStep ? 'primary.main' : 'grey.300',
                  }}
                />
              ))}
            </Box>
            
            <Box display="flex" gap={1}>
              {currentStep > 0 && (
                <Button onClick={handleBack}>
                  Back
                </Button>
              )}
              
              <Button onClick={handleSkip} color="inherit">
                Skip
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button variant="contained" onClick={handleNext} disabled={progress < 100 && currentStep === 0}>
                  Next
                </Button>
              ) : (
                <Button variant="contained" onClick={handleStartTour} startIcon={<RocketIcon />}>
                  Take Interactive Tour
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeExperience;