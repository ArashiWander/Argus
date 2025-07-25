import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton,
  Chip,
  Fade,
  Grow,
} from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: SvgIconComponent;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: IconComponent,
  color = 'primary',
  trend,
  delay = 0,
}) => {
  return (
    <Grow in timeout={300 + delay * 100}>
      <Card
        sx={{
          position: 'relative',
          overflow: 'visible',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${
              color === 'primary' ? '#3b82f6, #60a5fa' :
              color === 'secondary' ? '#8b5cf6, #a78bfa' :
              color === 'success' ? '#10b981, #34d399' :
              color === 'warning' ? '#f59e0b, #fbbf24' :
              color === 'error' ? '#ef4444, #f87171' :
              '#06b6d4, #22d3ee'
            })`,
            borderRadius: '12px 12px 0 0',
          },
        }}
      >
        <CardContent sx={{ pt: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              {IconComponent && (
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    backgroundColor: `${color}.main`,
                    color: 'white',
                    mr: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconComponent sx={{ fontSize: 20 }} />
                </Box>
              )}
              <Typography variant="h6" color="text.secondary" fontWeight={500}>
                {title}
              </Typography>
            </Box>
            <IconButton size="small" sx={{ opacity: 0.7 }}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Typography 
            variant="h3" 
            color={`${color}.main`}
            fontWeight={700}
            sx={{ mb: 1 }}
          >
            {value}
          </Typography>
          
          <Box display="flex" alignItems="center" justifyContent="space-between">
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Chip
                label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
                size="small"
                color={trend.isPositive ? 'success' : 'error'}
                sx={{
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );
};

interface MetricCardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  loading?: boolean;
  delay?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  children,
  action,
  delay = 0,
}) => {
  return (
    <Fade in timeout={300 + delay * 100}>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
            {action}
          </Box>
          {children}
        </CardContent>
      </Card>
    </Fade>
  );
};

interface StatusCardProps {
  title: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  message?: string;
  details?: Array<{ label: string; value: string; status?: string }>;
  delay?: number;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  message,
  details = [],
  delay = 0,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'OK':
        return 'success';
      case 'warning':
      case 'not_connected':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Grow in timeout={300 + delay * 100}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            {title}
          </Typography>
          
          {message && (
            <Chip 
              label={message} 
              color={getStatusColor(status)}
              sx={{ mb: 2, fontWeight: 500 }}
            />
          )}
          
          {details.map((detail, index) => (
            <Box 
              key={index} 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                {detail.label}:
              </Typography>
              {detail.status ? (
                <Chip 
                  label={detail.value} 
                  size="small"
                  color={getStatusColor(detail.status)}
                />
              ) : (
                <Typography variant="body2" fontWeight={500}>
                  {detail.value}
                </Typography>
              )}
            </Box>
          ))}
        </CardContent>
      </Card>
    </Grow>
  );
};