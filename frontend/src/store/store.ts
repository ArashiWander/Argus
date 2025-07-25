import { configureStore } from '@reduxjs/toolkit';

// Simple dummy slice for testing
const dummySlice = {
  name: 'dummy',
  initialState: {},
  reducers: {}
};

export const store = configureStore({
  reducer: {
    dummy: (state = {}) => state,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;