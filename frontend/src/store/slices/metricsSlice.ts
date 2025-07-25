import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { metricsApi } from '../../services/api';

export interface Metric {
  id: string;
  name: string;
  value: number;
  service: string;
  timestamp: string;
  tags: { [key: string]: string };
}

export interface MetricsStats {
  total_metrics: number;
  unique_services: number;
  unique_metric_names: number;
  oldest_metric: string | null;
  newest_metric: string | null;
}

interface MetricsState {
  metrics: Metric[];
  stats: MetricsStats | null;
  loading: boolean;
  error: string | null;
  selectedService: string | null;
  selectedMetricName: string | null;
}

const initialState: MetricsState = {
  metrics: [],
  stats: null,
  loading: false,
  error: null,
  selectedService: null,
  selectedMetricName: null,
};

// Async thunks
export const fetchMetrics = createAsyncThunk(
  'metrics/fetchMetrics',
  async (params?: { service?: string; metric_name?: string; start?: string; end?: string }) => {
    const response = await metricsApi.getMetrics(params);
    return response.data;
  }
);

export const fetchMetricsStats = createAsyncThunk(
  'metrics/fetchStats',
  async () => {
    const response = await metricsApi.getStats();
    return response.data;
  }
);

export const submitMetric = createAsyncThunk(
  'metrics/submitMetric',
  async (metric: Omit<Metric, 'id'>) => {
    const response = await metricsApi.submitMetric(metric);
    return response.data;
  }
);

const metricsSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {
    setSelectedService: (state, action: PayloadAction<string | null>) => {
      state.selectedService = action.payload;
    },
    setSelectedMetricName: (state, action: PayloadAction<string | null>) => {
      state.selectedMetricName = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetMetrics: (state) => {
      state.metrics = [];
      state.stats = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch metrics
      .addCase(fetchMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload.metrics || [];
      })
      .addCase(fetchMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch metrics';
      })
      // Fetch stats
      .addCase(fetchMetricsStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMetricsStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchMetricsStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch metrics stats';
      })
      // Submit metric
      .addCase(submitMetric.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitMetric.fulfilled, (state, action) => {
        state.loading = false;
        // Add the new metric to the list
        if (action.payload) {
          state.metrics.unshift(action.payload);
        }
      })
      .addCase(submitMetric.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to submit metric';
      });
  },
});

export const { setSelectedService, setSelectedMetricName, clearError, resetMetrics } = metricsSlice.actions;

export default metricsSlice.reducer;