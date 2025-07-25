import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Avatar,
  Menu,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Fade,
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Visibility as VisibilityIcon,
  AccountCircle as AccountIcon,
  ExitToApp as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { mode, toggleMode } = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Metrics', path: '/metrics' },
    { label: 'Logs', path: '/logs' },
    { label: 'Alerts', path: '/alerts' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Security', path: '/security' },
  ];

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
  };

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ minHeight: '72px !important' }}>
        {/* Logo and Brand */}
        <Box display="flex" alignItems="center" sx={{ mr: 4 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <VisibilityIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography 
              variant="h5" 
              component="div" 
              fontWeight={700}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                lineHeight: 1,
              }}
            >
              Argus
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.5px' }}
            >
              MONITORING PLATFORM
            </Typography>
          </Box>
        </Box>
        
        {/* Navigation Items */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, flex: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              component={RouterLink}
              to={item.path}
              sx={{
                px: 2,
                py: 1,
                borderRadius: 2,
                fontWeight: 500,
                fontSize: '0.875rem',
                position: 'relative',
                color: 'text.primary',
                backgroundColor: location.pathname === item.path ? 'action.selected' : 'transparent',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  transform: 'translateY(-1px)',
                },
                '&::after': location.pathname === item.path ? {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  width: '60%',
                  height: 2,
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                  transform: 'translateX(-50%)',
                  borderRadius: '2px 2px 0 0',
                } : {},
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* Right side actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Theme Toggle */}
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton 
              onClick={toggleMode}
              sx={{
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          {isAuthenticated && user ? (
            <>
              <Chip 
                label={user.role} 
                size="small" 
                color="secondary" 
                sx={{ 
                  mx: 1,
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              />
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleMenuOpen}
                  sx={{
                    p: 0.5,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      fontWeight: 600,
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                TransitionComponent={Fade}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 180,
                    borderRadius: 2,
                    boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  },
                }}
              >
                <MenuItem disabled sx={{ opacity: '1 !important' }}>
                  <AccountIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {user.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.role}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem 
                  onClick={handleLogout}
                  sx={{
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: 'error.light',
                      color: 'error.contrastText',
                    },
                  }}
                >
                  <LogoutIcon sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button 
              color="primary" 
              variant="contained"
              component={RouterLink} 
              to="/auth"
              sx={{
                borderRadius: 2,
                fontWeight: 500,
                px: 3,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Login
            </Button>
          )}

          {/* Mobile menu button */}
          <IconButton
            sx={{ 
              display: { xs: 'flex', md: 'none' },
              ml: 1,
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;