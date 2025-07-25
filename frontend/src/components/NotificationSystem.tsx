import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Typography,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface NotificationContextValue {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  hideNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = () => `notification-${Date.now()}-${Math.random()}`;

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const newNotification: Notification = {
      id,
      duration: 6000, // Default 6 seconds
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-hide notification unless it's persistent
    if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
      }, newNotification.duration);
    }
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    showNotification({
      type: 'success',
      title,
      message,
    });
  }, [showNotification]);

  const showError = useCallback((message: string, title?: string) => {
    showNotification({
      type: 'error',
      title,
      message,
      duration: 8000, // Errors stay longer
    });
  }, [showNotification]);

  const showWarning = useCallback((message: string, title?: string) => {
    showNotification({
      type: 'warning',
      title,
      message,
      duration: 7000,
    });
  }, [showNotification]);

  const showInfo = useCallback((message: string, title?: string) => {
    showNotification({
      type: 'info',
      title,
      message,
    });
  }, [showNotification]);

  const value: NotificationContextValue = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer notifications={notifications} onHide={hideNotification} />
    </NotificationContext.Provider>
  );
};

interface NotificationContainerProps {
  notifications: Notification[];
  onHide: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onHide }) => {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    // Provide helpful context for common operations
    const { type, message } = notification;
    
    if (type === 'success') {
      if (message.includes('metric') || message.includes('data')) {
        return 'Great! Your data has been successfully submitted to Argus.';
      }
      if (message.includes('saved') || message.includes('created')) {
        return 'Configuration saved successfully. Changes are now active.';
      }
    }
    
    if (type === 'error') {
      if (message.includes('network') || message.includes('connection')) {
        return 'Connection failed. Please check if the Argus backend is running.';
      }
      if (message.includes('validation') || message.includes('invalid')) {
        return 'Please check your input and try again.';
      }
    }
    
    return message;
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        maxWidth: 400,
      }}
    >
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            severity={notification.type}
            variant="filled"
            icon={getIcon(notification.type)}
            action={
              <Box display="flex" alignItems="center" gap={1}>
                {notification.action && (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={notification.action.onClick}
                  >
                    {notification.action.label}
                  </Button>
                )}
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => onHide(notification.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
            sx={{
              width: '100%',
              '& .MuiAlert-message': {
                flexGrow: 1,
              },
            }}
          >
            {notification.title && (
              <AlertTitle>{notification.title}</AlertTitle>
            )}
            <Typography variant="body2">
              {getNotificationMessage(notification)}
            </Typography>
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
};

// Utility hook for common notification patterns
export const useCommonNotifications = () => {
  const { showSuccess, showError, showInfo, showWarning } = useNotifications();

  return {
    notifySuccess: (operation: string) => {
      showSuccess(`${operation} completed successfully!`);
    },
    
    notifyError: (operation: string, error?: string) => {
      const message = error 
        ? `${operation} failed: ${error}`
        : `${operation} failed. Please try again.`;
      showError(message);
    },
    
    notifyDataSubmitted: (type: 'metric' | 'log') => {
      showSuccess(
        `${type === 'metric' ? 'Metric' : 'Log entry'} submitted successfully!`,
        'Data Submitted'
      );
    },
    
    notifyConnectionError: () => {
      showError(
        'Unable to connect to the Argus backend. Please check if the server is running.',
        'Connection Error'
      );
    },
    
    notifyFirstRun: () => {
      showInfo(
        'Welcome to Argus! Click the help button (?) for a guided tour.',
        'Welcome!'
      );
    },
    
    notifyDemoData: () => {
      showSuccess(
        'Sample data has been generated. Explore the dashboard to see it in action!',
        'Demo Data Ready'
      );
    },
    
    notifyPlatformStatus: (isHealthy: boolean) => {
      if (isHealthy) {
        showSuccess('All systems are running normally.', 'Platform Healthy');
      } else {
        showWarning('Some services may be experiencing issues.', 'Health Check Warning');
      }
    },
  };
};

export default NotificationProvider;