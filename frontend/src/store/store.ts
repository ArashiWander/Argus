import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    // Will add slices here as we implement them
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;