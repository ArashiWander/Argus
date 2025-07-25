import { configureStore } from '@reduxjs/toolkit';
import metricsSlice from './slices/metricsSlice';
import logsSlice from './slices/logsSlice';
import analyticsSlice from './slices/analyticsSlice';
import securitySlice from './slices/securitySlice';

export const store = configureStore({
  reducer: {
    metrics: metricsSlice,
    logs: logsSlice,
    analytics: analyticsSlice,
    security: securitySlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;