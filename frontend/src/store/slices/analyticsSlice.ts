import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { analyticsApi } from '../../services/api';

export interface Anomaly {
  id: string;
  metric_name: string;
  service: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  algorithm: string;
  value: number;
  threshold: number;
  timestamp: string;
  details: any;
}

export interface Prediction {
  id: string;
  metric_name: string;
  service: string;
  predictions: Array<{
    timestamp: string;
    predicted_value: number;
    confidence_interval: {
      lower: number;
      upper: number;
    };
  }>;
  horizon_hours: number;
  created_at: string;
}

export interface Insight {
  id: string;
  type: 'performance' | 'capacity' | 'trend' | 'pattern';
  title: string;
  description: string;
  service: string;
  severity: 'info' | 'warning' | 'critical';
  metrics: string[];
  timestamp: string;
  data: any;
}

interface AnalyticsState {
  anomalies: Anomaly[];
  predictions: Prediction[];
  insights: Insight[];
  loading: boolean;
  error: string | null;
  selectedService: string | null;
  selectedMetric: string | null;
}

const initialState: AnalyticsState = {
  anomalies: [],
  predictions: [],
  insights: [],
  loading: false,
  error: null,
  selectedService: null,
  selectedMetric: null,
};

// Async thunks
export const fetchAnomalies = createAsyncThunk(
  'analytics/fetchAnomalies',
  async (params?: { service?: string; metric_name?: string; severity?: string }) => {
    const response = await analyticsApi.getAnomalies(params);
    return response.data;
  }
);

export const fetchInsights = createAsyncThunk(
  'analytics/fetchInsights',
  async (params?: { service?: string; type?: string }) => {
    const response = await analyticsApi.getInsights(params);
    return response.data;
  }
);

export const detectAnomalies = createAsyncThunk(
  'analytics/detectAnomalies',
  async (params: { metric_name: string; service?: string; lookback_hours?: number }) => {
    const response = await analyticsApi.detectAnomalies(params);
    return response.data;
  }
);

export const generatePredictions = createAsyncThunk(
  'analytics/generatePredictions',
  async (params: { metric_name: string; service?: string; horizon_hours?: number }) => {
    const response = await analyticsApi.generatePredictions(params);
    return response.data;
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setSelectedService: (state, action: PayloadAction<string | null>) => {
      state.selectedService = action.payload;
    },
    setSelectedMetric: (state, action: PayloadAction<string | null>) => {
      state.selectedMetric = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetAnalytics: (state) => {
      state.anomalies = [];
      state.predictions = [];
      state.insights = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch anomalies
      .addCase(fetchAnomalies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnomalies.fulfilled, (state, action) => {
        state.loading = false;
        state.anomalies = action.payload.anomalies || [];
      })
      .addCase(fetchAnomalies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch anomalies';
      })
      // Fetch insights
      .addCase(fetchInsights.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInsights.fulfilled, (state, action) => {
        state.loading = false;
        state.insights = action.payload.insights || [];
      })
      .addCase(fetchInsights.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch insights';
      })
      // Detect anomalies
      .addCase(detectAnomalies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(detectAnomalies.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(detectAnomalies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to detect anomalies';
      })
      // Generate predictions
      .addCase(generatePredictions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generatePredictions.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(generatePredictions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate predictions';
      });
  },
});

export const { setSelectedService, setSelectedMetric, clearError, resetAnalytics } = analyticsSlice.actions;

export default analyticsSlice.reducer;