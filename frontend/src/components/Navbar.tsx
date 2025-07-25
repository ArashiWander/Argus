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
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Visibility as VisibilityIcon,
  AccountCircle as AccountIcon,
  ExitToApp as LogoutIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Timeline as MetricsIcon,
  Storage as LogsIcon,
  Notifications as AlertsIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navItems = [

    { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { label: 'Metrics', path: '/metrics', icon: <MetricsIcon /> },
    { label: 'Logs', path: '/logs', icon: <LogsIcon /> },
    { label: 'Alerts', path: '/alerts', icon: <AlertsIcon /> },
    { label: 'Analytics', path: '/analytics', icon: <AnalyticsIcon /> },
    { label: 'Security', path: '/security', icon: <SecurityIcon /> },

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

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const getCurrentPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : 'Argus';
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <Tooltip title="Open navigation menu">
              <IconButton
                color="inherit"
                aria-label="open navigation menu"
                onClick={handleMobileMenuToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <VisibilityIcon sx={{ mr: 2 }} aria-hidden="true" />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ flexGrow: 1 }}
            aria-label={`Argus Monitoring Platform - Current page: ${getCurrentPageTitle()}`}
          >
            Argus Monitoring Platform
            {isMobile && (
              <Typography variant="body2" component="div">
                {getCurrentPageTitle()}
              </Typography>
            )}
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} role="navigation" aria-label="Main navigation">
              {navItems.map((item) => (
                <Tooltip key={item.path} title={`Go to ${item.label}`}>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to={item.path}
                    aria-label={`Navigate to ${item.label}`}
                    aria-current={location.pathname === item.path ? 'page' : undefined}
                    sx={{
                      backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      '&:focus': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                </Tooltip>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAuthenticated && user ? (
              <>
                <Tooltip title={`Current role: ${user.role}`}>
                  <Chip 
                    label={user.role} 
                    size="small" 
                    color="secondary" 
                    sx={{ mx: 1 }}
                  />
                </Tooltip>
                <Tooltip title={`Account menu for ${user.username}`}>
                  <IconButton
                    color="inherit"
                    onClick={handleMenuOpen}
                    sx={{ ml: 1 }}
                    aria-label="Account menu"
                    aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
                  >
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  id="account-menu"
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  MenuListProps={{
                    'aria-labelledby': 'account-menu',
                  }}
                >
                  <MenuItem disabled>
                    <AccountIcon sx={{ mr: 1 }} />
                    {user.username}
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Tooltip title="Sign in to your account">
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/auth"
                  aria-label="Sign in to your account"
                >
                  Login
                </Button>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        <Box
          sx={{ width: 250 }}
          role="navigation"
          aria-label="Mobile navigation"
          onClick={handleMobileMenuClose}
          onKeyDown={handleMobileMenuClose}
        >
          <List>
            {navItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={item.path}
                  selected={location.pathname === item.path}
                  aria-label={`Navigate to ${item.label}`}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;