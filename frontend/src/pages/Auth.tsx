import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Login from '../components/Login';
import Register from '../components/Register';
import { useAuth } from '../contexts/AuthContext';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, login } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = (token: string, user: any) => {
    login(token, user);
  };

  const handleRegister = () => {
    setIsLogin(true); // Switch to login after successful registration
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <>
      {isLogin ? (
        <Login onLogin={handleLogin} onToggleMode={toggleMode} />
      ) : (
        <Register onRegister={handleRegister} onToggleMode={toggleMode} />
      )}
    </>
  );
};

export default Auth;