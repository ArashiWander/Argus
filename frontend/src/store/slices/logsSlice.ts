import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { logsApi } from '../../services/api';

export interface LogEntry {
  id: string;
  level: string;
  message: string;
  service: string;
  timestamp: string;
  tags: { [key: string]: string };
}

export interface LogsStats {
  total_logs: number;
  unique_services: number;
  log_levels: { [key: string]: number };
  oldest_log: string | null;
  newest_log: string | null;
}

interface LogsState {
  logs: LogEntry[];
  stats: LogsStats | null;
  loading: boolean;
  error: string | null;
  selectedService: string | null;
  selectedLevel: string | null;
  searchQuery: string;
}

const initialState: LogsState = {
  logs: [],
  stats: null,
  loading: false,
  error: null,
  selectedService: null,
  selectedLevel: null,
  searchQuery: '',
};

// Async thunks
export const fetchLogs = createAsyncThunk(
  'logs/fetchLogs',
  async (params?: { service?: string; level?: string; search?: string; start?: string; end?: string }) => {
    const response = await logsApi.getLogs(params);
    return response.data;
  }
);

export const fetchLogsStats = createAsyncThunk(
  'logs/fetchStats',
  async () => {
    const response = await logsApi.getStats();
    return response.data;
  }
);

export const submitLog = createAsyncThunk(
  'logs/submitLog',
  async (log: Omit<LogEntry, 'id'>) => {
    const response = await logsApi.submitLog(log);
    return response.data;
  }
);

const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    setSelectedService: (state, action: PayloadAction<string | null>) => {
      state.selectedService = action.payload;
    },
    setSelectedLevel: (state, action: PayloadAction<string | null>) => {
      state.selectedLevel = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetLogs: (state) => {
      state.logs = [];
      state.stats = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch logs
      .addCase(fetchLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload.logs || [];
      })
      .addCase(fetchLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch logs';
      })
      // Fetch stats
      .addCase(fetchLogsStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLogsStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchLogsStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch logs stats';
      })
      // Submit log
      .addCase(submitLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitLog.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.logs.unshift(action.payload);
        }
      })
      .addCase(submitLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to submit log';
      });
  },
});

export const { setSelectedService, setSelectedLevel, setSearchQuery, clearError, resetLogs } = logsSlice.actions;

export default logsSlice.reducer;