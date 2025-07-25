import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '../theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme mode from localStorage or default to 'light'
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('argus-theme-mode');
    return (savedMode as ThemeMode) || 'light';
  });

  // Update localStorage when mode changes
  useEffect(() => {
    localStorage.setItem('argus-theme-mode', mode);
  }, [mode]);

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const theme = createAppTheme(mode);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};