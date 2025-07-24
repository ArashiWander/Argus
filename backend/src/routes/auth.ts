import { Router, Request, Response } from 'express';
import { authService } from '../services/authService';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { logAuthenticationEvent, auditableEndpoint, secureDataAccess } from '../middleware/audit';
import { logger } from '../config/logger';

const router = Router();

// Register new user
router.post('/register', logAuthenticationEvent('register'), async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields: username, email, password'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    const user = await authService.createUser({
      username,
      email,
      password,
      role: role || 'user'
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    logger.error('Registration error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

// Login user
router.post('/login', logAuthenticationEvent('login'), async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing required fields: username, password'
      });
    }

    const authResult = await authService.authenticateUser({ username, password });

    res.json({
      message: 'Login successful',
      ...authResult
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(401).json({ error: error.message || 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, ...secureDataAccess('user_profile'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await authService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error: any) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireRole('admin'), ...secureDataAccess('users'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await authService.getAllUsers();
    res.json({ users, count: users.length });
  } catch (error: any) {
    logger.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Verify token (for frontend to check auth status)
router.get('/verify', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  // In a more sophisticated setup, we might maintain a blacklist of tokens
  // For now, we just acknowledge the logout
  logger.info(`User logged out: ${req.user?.username}`);
  res.json({ message: 'Logout successful' });
});

export { router as authRoutes };