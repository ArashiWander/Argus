import React from 'react';
import { Box, Card, CardContent, Skeleton, Grid } from '@mui/material';

export const StatCardSkeleton: React.FC = () => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
        <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
        <Skeleton variant="text" width="60%" height={24} />
      </Box>
      <Skeleton variant="text" width="40%" height={40} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="80%" height={16} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="60%" height={16} />
    </CardContent>
  </Card>
);

export const ChartCardSkeleton: React.FC = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
    </CardContent>
  </Card>
);

export const DashboardSkeleton: React.FC = () => (
  <Box>
    {/* Header skeleton */}
    <Skeleton variant="text" width="30%" height={48} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="50%" height={24} sx={{ mb: 4 }} />
    
    {/* Stats cards grid skeleton */}
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {[...Array(6)].map((_, index) => (
        <Grid item xs={12} md={6} lg={4} key={index}>
          <StatCardSkeleton />
        </Grid>
      ))}
    </Grid>
    
    {/* Chart skeletons */}
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <ChartCardSkeleton />
      </Grid>
      <Grid item xs={12} lg={6}>
        <ChartCardSkeleton />
      </Grid>
      <Grid item xs={12} lg={6}>
        <ChartCardSkeleton />
      </Grid>
    </Grid>
  </Box>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="30%" height={28} sx={{ mb: 2 }} />
      {[...Array(rows)].map((_, index) => (
        <Box key={index} display="flex" alignItems="center" sx={{ mb: 1 }}>
          <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={20} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
          <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
        </Box>
      ))}
    </CardContent>
  </Card>
);