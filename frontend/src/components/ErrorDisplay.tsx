import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Link,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Build as FixIcon,
  Help as HelpIcon,
  CheckCircle as CheckIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

interface ErrorDisplayProps {
  error: string | Error;
  context?: string;
  onRetry?: () => void;
  showTroubleshooting?: boolean;
}

interface ErrorSolution {
  issue: string;
  solutions: string[];
  commands?: string[];
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  context = 'operation',
  onRetry,
  showTroubleshooting = true,
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' && error.stack ? error.stack : null;

  // Common error patterns and their solutions
  const getErrorSolutions = (errorMsg: string): ErrorSolution[] => {
    const msg = errorMsg.toLowerCase();
    const solutions: ErrorSolution[] = [];

    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
      solutions.push({
        issue: 'Network Connection Error',
        solutions: [
          'Check if the backend server is running',
          'Verify the API endpoint URL is correct',
          'Check your internet connection',
          'Ensure firewall is not blocking the connection',
        ],
        commands: [
          './argus status',
          './argus health',
          'curl http://localhost:3001/api/health',
        ],
      });
    }

    if (msg.includes('port') || msg.includes('eaddrinuse') || msg.includes('3001') || msg.includes('3000')) {
      solutions.push({
        issue: 'Port Already In Use',
        solutions: [
          'Stop processes using the ports',
          'Change the port configuration',
          'Restart the platform',
        ],
        commands: [
          './argus stop',
          'lsof -ti:3000,3001 | xargs kill -9',
          './argus start',
        ],
      });
    }

    if (msg.includes('permission') || msg.includes('eacces')) {
      solutions.push({
        issue: 'Permission Denied',
        solutions: [
          'Make scripts executable',
          'Check file permissions',
          'Run with appropriate user permissions',
        ],
        commands: [
          'chmod +x *.sh',
          'chmod +x argus',
          'ls -la *.sh',
        ],
      });
    }

    if (msg.includes('module') || msg.includes('package') || msg.includes('npm')) {
      solutions.push({
        issue: 'Dependency Issues',
        solutions: [
          'Reinstall dependencies',
          'Clear npm cache',
          'Run the setup wizard again',
        ],
        commands: [
          './setup.sh',
          'cd backend && npm install',
          'cd frontend && npm install',
          'npm cache clean --force',
        ],
      });
    }

    if (msg.includes('database') || msg.includes('influx') || msg.includes('postgres') || msg.includes('redis')) {
      solutions.push({
        issue: 'Database Connection Error',
        solutions: [
          'Start database services',
          'Check database configuration',
          'Verify connection URLs in environment files',
          'Use in-memory storage for testing',
        ],
        commands: [
          'docker-compose -f docker-compose.dev.yml up -d',
          './health-check.sh',
          'cat backend/.env',
        ],
      });
    }

    if (msg.includes('node') || msg.includes('version')) {
      solutions.push({
        issue: 'Node.js Version Issue',
        solutions: [
          'Update Node.js to version 18 or higher',
          'Use Node Version Manager (nvm)',
          'Check current Node.js version',
        ],
        commands: [
          'node --version',
          'nvm install 18',
          'nvm use 18',
        ],
      });
    }

    // Generic fallback solution
    if (solutions.length === 0) {
      solutions.push({
        issue: 'General Troubleshooting',
        solutions: [
          'Check the platform status',
          'View recent logs for more details',
          'Restart the platform',
          'Run the health check',
        ],
        commands: [
          './argus status',
          './argus logs error',
          './argus restart',
          './health-check.sh',
        ],
      });
    }

    return solutions;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  };

  const solutions = getErrorSolutions(errorMessage);

  return (
    <Box>
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Error in {context}</AlertTitle>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {errorMessage}
        </Typography>
        
        <Box display="flex" gap={1} flexWrap="wrap">
          {onRetry && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              Try Again
            </Button>
          )}
          
          <Button
            size="small"
            variant="outlined"
            startIcon={<HelpIcon />}
            onClick={() => window.open('https://github.com/ArashiWander/Argus#troubleshooting', '_blank')}
          >
            View Documentation
          </Button>
        </Box>
      </Alert>

      {showTroubleshooting && solutions.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            🔧 Troubleshooting Steps
          </Typography>
          
          {solutions.map((solution, index) => (
            <Accordion key={index} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <FixIcon color="primary" />
                  <Typography variant="subtitle1">{solution.issue}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {solution.solutions.map((step, stepIndex) => (
                    <ListItem key={stepIndex}>
                      <ListItemIcon>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={step} />
                    </ListItem>
                  ))}
                </List>
                
                {solution.commands && solution.commands.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      💻 Helpful Commands:
                    </Typography>
                    {solution.commands.map((command, cmdIndex) => (
                      <Box key={cmdIndex} mb={1}>
                        <Chip
                          label={command}
                          variant="outlined"
                          size="small"
                          icon={<CopyIcon />}
                          onClick={() => copyToClipboard(command)}
                          sx={{ 
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        />
                      </Box>
                    ))}
                    <Typography variant="caption" color="text.secondary">
                      Click commands to copy to clipboard
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {errorStack && (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Technical Details (for developers)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              component="pre"
              sx={{
                backgroundColor: 'grey.100',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
              }}
            >
              {errorStack}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Need more help?</strong> Check the{' '}
          <Link href="https://github.com/ArashiWander/Argus/blob/main/GETTING_STARTED.md" target="_blank">
            Getting Started Guide
          </Link>{' '}
          or create an issue on{' '}
          <Link href="https://github.com/ArashiWander/Argus/issues" target="_blank">
            GitHub
          </Link>{' '}
          with the error details above.
        </Typography>
      </Alert>
    </Box>
  );
};

export default ErrorDisplay;