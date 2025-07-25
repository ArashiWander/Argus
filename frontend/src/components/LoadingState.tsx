import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Card,
  CardContent,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  CloudSync as SyncIcon,
  Timeline as MetricsIcon,
  Storage as DataIcon,
  Speed as DashboardIcon,
} from '@mui/icons-material';

interface LoadingStateProps {
  type?: 'circular' | 'linear' | 'skeleton' | 'card';
  message?: string;
  context?: 'dashboard' | 'metrics' | 'logs' | 'general';
  size?: 'small' | 'medium' | 'large';
  showTips?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'circular',
  message,
  context = 'general',
  size = 'medium',
  showTips = false,
}) => {
  const getContextMessage = () => {
    if (message) return message;
    
    switch (context) {
      case 'dashboard':
        return 'Loading dashboard data...';
      case 'metrics':
        return 'Fetching metrics data...';
      case 'logs':
        return 'Searching log entries...';
      default:
        return 'Loading...';
    }
  };

  const getContextIcon = () => {
    switch (context) {
      case 'dashboard':
        return <DashboardIcon color="primary" />;
      case 'metrics':
        return <MetricsIcon color="primary" />;
      case 'logs':
        return <DataIcon color="primary" />;
      default:
        return <SyncIcon color="primary" />;
    }
  };

  const getContextTip = () => {
    switch (context) {
      case 'dashboard':
        return 'The dashboard auto-refreshes every 30 seconds with the latest data.';
      case 'metrics':
        return 'Tip: Use the time range selector to view historical metrics data.';
      case 'logs':
        return 'Tip: Try filtering by log level or service name for faster results.';
      default:
        return 'This should only take a moment...';
    }
  };

  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 60;
      default:
        return 40;
    }
  };

  if (type === 'skeleton') {
    return (
      <Box>
        <Skeleton variant="text" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 1 }} />
        <Skeleton variant="text" height={20} width="60%" />
      </Box>
    );
  }

  if (type === 'card') {
    return (
      <Card>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <Box mb={2}>
              {getContextIcon()}
            </Box>
            <CircularProgress size={getSizeValue()} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {getContextMessage()}
            </Typography>
            {showTips && (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                {getContextTip()}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (type === 'linear') {
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={2}>
          {getContextIcon()}
          <Typography variant="body1" sx={{ ml: 1 }}>
            {getContextMessage()}
          </Typography>
        </Box>
        <LinearProgress />
        {showTips && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {getContextTip()}
          </Typography>
        )}
      </Box>
    );
  }

  // Default circular loading
  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center"
      minHeight={size === 'large' ? '400px' : size === 'small' ? '100px' : '200px'}
    >
      <Box mb={2}>
        {getContextIcon()}
      </Box>
      <CircularProgress size={getSizeValue()} sx={{ mb: 2 }} />
      <Typography variant="body1" color="text.secondary" textAlign="center">
        {getContextMessage()}
      </Typography>
      {showTips && (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1, maxWidth: 400 }}>
          {getContextTip()}
        </Typography>
      )}
    </Box>
  );
};

// Empty state component for when there's no data
interface EmptyStateProps {
  context?: 'dashboard' | 'metrics' | 'logs' | 'alerts' | 'general';
  title?: string;
  description?: string;
  actionButton?: React.ReactNode;
  showSuggestions?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  context = 'general',
  title,
  description,
  actionButton,
  showSuggestions = true,
}) => {
  const getEmptyStateContent = () => {
    switch (context) {
      case 'dashboard':
        return {
          title: title || '📊 No Data Available',
          description: description || 'Your dashboard will show data once metrics and logs are collected.',
          suggestions: [
            'Run ./argus demo to generate sample data',
            'Submit your first metric using ./argus submit-metric',
            'Check that your applications are sending data to the API',
          ],
        };
      case 'metrics':
        return {
          title: title || '📈 No Metrics Found',
          description: description || 'No metrics match your current filters or time range.',
          suggestions: [
            'Try expanding the time range',
            'Remove filters to see all metrics',
            'Generate sample data with ./argus demo',
            'Submit a test metric using the API',
          ],
        };
      case 'logs':
        return {
          title: title || '📝 No Log Entries',
          description: description || 'No log entries found for the current search criteria.',
          suggestions: [
            'Try different search terms or filters',
            'Check the time range settings',
            'Generate sample logs with ./argus demo',
            'Verify your applications are sending logs',
          ],
        };
      case 'alerts':
        return {
          title: title || '🔔 No Alerts',
          description: description || 'No alerts are currently active.',
          suggestions: [
            'This is good! No alerts means no issues detected',
            'Create alert rules to monitor for problems',
            'Generate test alerts with ./argus demo',
          ],
        };
      default:
        return {
          title: title || '🤔 Nothing Here Yet',
          description: description || 'No data is available at the moment.',
          suggestions: [
            'Check back in a few moments',
            'Try refreshing the page',
            'Verify the service is running properly',
          ],
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center"
      textAlign="center"
      py={6}
      px={3}
    >
      <Typography variant="h5" gutterBottom>
        {content.title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
        {content.description}
      </Typography>
      
      {actionButton && (
        <Box mb={3}>
          {actionButton}
        </Box>
      )}
      
      {showSuggestions && content.suggestions.length > 0 && (
        <Alert severity="info" sx={{ textAlign: 'left', maxWidth: 600 }}>
          <Typography variant="subtitle2" gutterBottom>
            💡 Suggestions:
          </Typography>
          <Box component="ul" sx={{ margin: 0, paddingLeft: 2 }}>
            {content.suggestions.map((suggestion, index) => (
              <li key={index}>
                <Typography variant="body2">{suggestion}</Typography>
              </li>
            ))}
          </Box>
        </Alert>
      )}
    </Box>
  );
};

export default LoadingState;