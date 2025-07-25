import { createTheme } from '@mui/material/styles';

// Modern color palette inspired by state-of-the-art design systems
const lightPalette = {
  primary: {
    main: '#3b82f6', // Modern blue
    light: '#60a5fa',
    dark: '#1d4ed8',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#8b5cf6', // Modern purple
    light: '#a78bfa',
    dark: '#7c3aed',
    contrastText: '#ffffff',
  },
  background: {
    default: '#f8fafc', // Very light gray
    paper: '#ffffff',
  },
  text: {
    primary: '#0f172a', // Deep slate
    secondary: '#475569', // Medium slate
    disabled: '#94a3b8', // Light slate
  },
  divider: '#e2e8f0',
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
  },
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
  },
  info: {
    main: '#06b6d4',
    light: '#22d3ee',
    dark: '#0891b2',
  },
};

const darkPalette = {
  primary: {
    main: '#60a5fa',
    light: '#93c5fd',
    dark: '#3b82f6',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#a78bfa',
    light: '#c4b5fd',
    dark: '#8b5cf6',
    contrastText: '#ffffff',
  },
  background: {
    default: '#0f172a', // Very dark slate
    paper: '#1e293b', // Dark slate
  },
  text: {
    primary: '#f1f5f9', // Very light slate
    secondary: '#cbd5e1', // Light slate
    disabled: '#64748b', // Medium slate
  },
  divider: '#334155',
  success: {
    main: '#22c55e',
    light: '#4ade80',
    dark: '#16a34a',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
  },
  error: {
    main: '#f87171',
    light: '#fca5a5',
    dark: '#ef4444',
  },
  info: {
    main: '#22d3ee',
    light: '#67e8f9',
    dark: '#06b6d4',
  },
};

// Modern typography scale
const typography = {
  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.025em',
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.025em',
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.6,
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
  },
};

export const createAppTheme = (mode: 'light' | 'dark') => {
  const palette = mode === 'light' ? lightPalette : darkPalette;
  
  return createTheme({
    palette: {
      mode,
      ...palette,
    },
    typography,
    shape: {
      borderRadius: 8,
    },
    spacing: 8,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === 'light' ? '#f8fafc' : '#0f172a',
            fontFamily: typography.fontFamily,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
            boxShadow: mode === 'light' 
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: mode === 'light'
                ? '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
            padding: '0.5rem 1rem',
            transition: 'all 0.2s ease-in-out',
          } as const,
          contained: {
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transform: 'translateY(-1px)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            fontSize: '0.75rem',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
            color: mode === 'light' ? '#0f172a' : '#f1f5f9',
            borderBottom: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
            boxShadow: mode === 'light'
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            minHeight: '64px !important',
            padding: '0 24px',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
          },
          elevation1: {
            boxShadow: mode === 'light'
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: '1px solid',
            '&.MuiAlert-standardError': {
              borderColor: mode === 'light' ? '#fecaca' : '#f87171',
              backgroundColor: mode === 'light' ? '#fef2f2' : '#7f1d1d',
            },
            '&.MuiAlert-standardWarning': {
              borderColor: mode === 'light' ? '#fed7aa' : '#fb923c',
              backgroundColor: mode === 'light' ? '#fffbeb' : '#92400e',
            },
            '&.MuiAlert-standardInfo': {
              borderColor: mode === 'light' ? '#bae6fd' : '#38bdf8',
              backgroundColor: mode === 'light' ? '#f0f9ff' : '#0c4a6e',
            },
            '&.MuiAlert-standardSuccess': {
              borderColor: mode === 'light' ? '#bbf7d0' : '#4ade80',
              backgroundColor: mode === 'light' ? '#f0fdf4' : '#14532d',
            },
          },
        },
      },
    },
  });
};

// Export default light theme for initial load
export default createAppTheme('light');