import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { securityApi } from '../../services/api';

export interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  action: string;
  outcome: 'success' | 'failure';
  timestamp: string;
  details: any;
}

export interface ThreatAlert {
  id: string;
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'investigating';
  events: string[];
}

export interface ComplianceReport {
  framework: string;
  status: 'compliant' | 'non_compliant' | 'unknown';
  score: number;
  requirements_met: number;
  total_requirements: number;
  findings: Array<{
    requirement: string;
    status: string;
    details: string;
  }>;
  generated_at: string;
}

interface SecurityState {
  events: SecurityEvent[];
  threats: ThreatAlert[];
  complianceReports: ComplianceReport[];
  loading: boolean;
  error: string | null;
  selectedEventType: string | null;
  selectedSeverity: string | null;
}

const initialState: SecurityState = {
  events: [],
  threats: [],
  complianceReports: [],
  loading: false,
  error: null,
  selectedEventType: null,
  selectedSeverity: null,
};

// Async thunks
export const fetchSecurityEvents = createAsyncThunk(
  'security/fetchEvents',
  async (params?: { event_type?: string; severity?: string; start?: string; end?: string }) => {
    const response = await securityApi.getEvents(params);
    return response.data;
  }
);

export const fetchThreats = createAsyncThunk(
  'security/fetchThreats',
  async (params?: { threat_type?: string; severity?: string; status?: string }) => {
    const response = await securityApi.getAlerts(params);
    return response.data;
  }
);

export const submitSecurityEvent = createAsyncThunk(
  'security/submitEvent',
  async (event: {
    event_type: string;
    severity: string;
    source_ip?: string;
    action: string;
    outcome: string;
    details?: any;
  }) => {
    const response = await securityApi.submitEvent(event);
    return response.data;
  }
);

const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    setSelectedEventType: (state, action: PayloadAction<string | null>) => {
      state.selectedEventType = action.payload;
    },
    setSelectedSeverity: (state, action: PayloadAction<string | null>) => {
      state.selectedSeverity = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetSecurity: (state) => {
      state.events = [];
      state.threats = [];
      state.complianceReports = [];
      state.error = null;
    },
    updateThreatStatus: (state, action: PayloadAction<{ id: string; status: string }>) => {
      const threat = state.threats.find(t => t.id === action.payload.id);
      if (threat) {
        threat.status = action.payload.status as any;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch security events
      .addCase(fetchSecurityEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSecurityEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events || [];
      })
      .addCase(fetchSecurityEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch security events';
      })
      // Fetch threats
      .addCase(fetchThreats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchThreats.fulfilled, (state, action) => {
        state.loading = false;
        state.threats = action.payload.threats || [];
      })
      .addCase(fetchThreats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch threats';
      })
      // Submit security event
      .addCase(submitSecurityEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitSecurityEvent.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.events.unshift(action.payload);
        }
      })
      .addCase(submitSecurityEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to submit security event';
      });
  },
});

export const { 
  setSelectedEventType, 
  setSelectedSeverity, 
  clearError, 
  resetSecurity, 
  updateThreatStatus 
} = securitySlice.actions;

export default securitySlice.reducer;