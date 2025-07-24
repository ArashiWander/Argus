import { postgres } from '../config/database';
import { logger } from '../config/logger';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthToken {
  token: string;
  expiresIn: string;
  user: Omit<User, 'password_hash'>;
}

class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'argus-dev-secret-key';
  private readonly jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  private readonly saltRounds = 10;

  // Fallback storage when PostgreSQL is not available
  private fallbackUsers: Array<User & { password_hash: string }> = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@argus.local',
      password_hash: '$2b$10$xQY9p8L6Xv.nQwRz5dxkK.5C3yxNQx2OYtQfZzBGH4hLrG7iKjG7.',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      username: 'user',
      email: 'user@argus.local',
      password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  async createUser(userData: CreateUserData): Promise<User> {
    const { username, email, password, role = 'user' } = userData;

    // Hash password
    const password_hash = await bcrypt.hash(password, this.saltRounds);

    if (postgres) {
      try {
        const result = await postgres.query(
          `INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING id, username, email, role, created_at, updated_at`,
          [username, email, password_hash, role]
        );

        const user = result.rows[0];
        logger.info(`User created: ${username} (${email})`);
        return user;
      } catch (error: any) {
        if (error.code === '23505') { // Unique violation
          throw new Error('Username or email already exists');
        }
        throw new Error('Failed to create user');
      }
    } else {
      // Fallback to in-memory storage
      const existingUser = this.fallbackUsers.find(
        u => u.username === username || u.email === email
      );

      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      const newUser = {
        id: this.fallbackUsers.length + 1,
        username,
        email,
        password_hash,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.fallbackUsers.push(newUser);
      logger.info(`User created in memory: ${username} (${email})`);

      // Return user without password_hash
      const { password_hash: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    }
  }

  async authenticateUser(loginData: LoginData): Promise<AuthToken> {
    const { username, password } = loginData;

    let user: (User & { password_hash: string }) | null = null;

    if (postgres) {
      try {
        const result = await postgres.query(
          `SELECT id, username, email, password_hash, role, created_at, updated_at
           FROM users WHERE username = $1`,
          [username]
        );

        user = result.rows[0] || null;
      } catch (error) {
        logger.error('Database error during authentication:', error);
        throw new Error('Authentication failed');
      }
    } else {
      // Fallback to in-memory storage
      user = this.fallbackUsers.find(u => u.username === username) || null;
    }

    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Invalid username or password');
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    } as jwt.SignOptions);

    logger.info(`User authenticated: ${username}`);

    // Return user without password_hash
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      token,
      expiresIn: this.jwtExpiresIn,
      user: userWithoutPassword,
    };
  }

  async getUserById(userId: number): Promise<User | null> {
    if (postgres) {
      try {
        const result = await postgres.query(
          `SELECT id, username, email, role, created_at, updated_at
           FROM users WHERE id = $1`,
          [userId]
        );

        return result.rows[0] || null;
      } catch (error) {
        logger.error('Database error fetching user:', error);
        return null;
      }
    } else {
      // Fallback to in-memory storage
      const user = this.fallbackUsers.find(u => u.id === userId);
      if (user) {
        const { password_hash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      return null;
    }
  }

  async getAllUsers(): Promise<User[]> {
    if (postgres) {
      try {
        const result = await postgres.query(
          `SELECT id, username, email, role, created_at, updated_at
           FROM users ORDER BY created_at DESC`
        );

        return result.rows;
      } catch (error) {
        logger.error('Database error fetching users:', error);
        return [];
      }
    } else {
      // Fallback to in-memory storage
      return this.fallbackUsers.map(user => {
        const { password_hash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    }
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async updateUserLastLogin(userId: number): Promise<void> {
    if (postgres) {
      try {
        await postgres.query(
          'UPDATE users SET updated_at = NOW() WHERE id = $1',
          [userId]
        );
      } catch (error) {
        logger.error('Failed to update user last login:', error);
      }
    }
    // For fallback storage, we don't track last login
  }
}

export const authService = new AuthService();