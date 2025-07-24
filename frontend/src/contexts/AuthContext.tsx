import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth data on app start
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('argus_token');
      const storedUser = localStorage.getItem('argus_user');

      if (storedToken && storedUser) {
        try {
          // Verify token is still valid
          const response = await authApi.verify();
          if (response.data.valid) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('argus_token');
            localStorage.removeItem('argus_user');
          }
        } catch (error) {
          // Token verification failed, clear storage
          localStorage.removeItem('argus_token');
          localStorage.removeItem('argus_user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('argus_token', newToken);
    localStorage.setItem('argus_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (error) {
      // Ignore logout API errors
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('argus_token');
      localStorage.removeItem('argus_user');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};