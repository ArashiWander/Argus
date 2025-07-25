import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Container,
  Divider,
  Fade,
  Grow,
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { authApi } from '../services/api';
import { LoginRequest } from '../types';
import { MetricCard } from './ui/Cards';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
  onToggleMode: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onToggleMode }) => {
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login(formData);
      const { token, user } = response.data;
      
      // Store auth data
      localStorage.setItem('argus_token', token);
      localStorage.setItem('argus_user', JSON.stringify(user));
      
      onLogin(token, user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (username: string) => {
    setFormData({
      username,
      password: username === 'admin' ? 'admin123' : 'password',
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          backdropFilter: 'blur(10px)',
        },
      }}
    >
      <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={600}>
          <Box>
            <MetricCard
              title=""
              delay={0}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2 }}>
                {/* Logo and Branding */}
                <Grow in timeout={800}>
                  <Box display="flex" alignItems="center" mb={3}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <VisibilityIcon sx={{ color: 'white', fontSize: 32 }} />
                    </Box>
                    <Box>
                      <Typography 
                        variant="h4" 
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
                        sx={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '1px' }}
                      >
                        MONITORING PLATFORM
                      </Typography>
                    </Box>
                  </Box>
                </Grow>

                <Fade in timeout={1000}>
                  <Box textAlign="center" mb={4}>
                    <Typography 
                      variant="h5" 
                      component="h1" 
                      gutterBottom
                      fontWeight={600}
                    >
                      Welcome Back
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Sign in to access your monitoring dashboard
                    </Typography>
                  </Box>
                </Fade>

                {error && (
                  <Fade in>
                    <Alert 
                      severity="error" 
                      sx={{ 
                        width: '100%',
                        mb: 3,
                        borderRadius: 2,
                        '& .MuiAlert-message': {
                          fontSize: '0.9rem',
                          fontWeight: 500,
                        },
                      }}
                      onClose={() => setError(null)}
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                  <Grow in timeout={1200}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="username"
                      label="Username"
                      name="username"
                      autoComplete="username"
                      autoFocus
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grow>
                  
                  <Grow in timeout={1400}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type="password"
                      id="password"
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grow>

                  <Grow in timeout={1600}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        fontSize: '1rem',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                          transform: 'translateY(-1px)',
                        },
                        '&:disabled': {
                          background: 'linear-gradient(135deg, #94a3b8, #cbd5e1)',
                        },
                        transition: 'all 0.2s ease-in-out',
                        mb: 3,
                      }}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </Grow>
                </Box>

                <Divider sx={{ width: '100%', my: 3 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Quick Demo Access
                  </Typography>
                </Divider>

                <Grow in timeout={1800}>
                  <Box sx={{ display: 'flex', gap: 2, width: '100%', mb: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={<AdminIcon />}
                      onClick={() => handleDemoLogin('admin')}
                      sx={{ 
                        flex: 1,
                        borderRadius: 2,
                        py: 1.2,
                        fontWeight: 500,
                        borderColor: 'primary.main',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          borderColor: 'primary.dark',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      Admin Demo
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<PersonIcon />}
                      onClick={() => handleDemoLogin('user')}
                      sx={{ 
                        flex: 1,
                        borderRadius: 2,
                        py: 1.2,
                        fontWeight: 500,
                        borderColor: 'secondary.main',
                        color: 'secondary.main',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          borderColor: 'secondary.dark',
                          color: 'secondary.dark',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      User Demo
                    </Button>
                  </Box>
                </Grow>

                <Fade in timeout={2000}>
                  <Box textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      Don't have an account?{' '}
                      <Link
                        component="button"
                        variant="body2"
                        onClick={onToggleMode}
                        sx={{ 
                          cursor: 'pointer',
                          fontWeight: 600,
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        Create Account
                      </Link>
                    </Typography>
                  </Box>
                </Fade>
              </Box>
            </MetricCard>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;