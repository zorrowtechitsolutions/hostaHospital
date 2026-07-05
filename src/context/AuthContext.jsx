// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const authData = localStorage.getItem('authData');
      
      if (token && !isTokenExpired(token)) {
        setIsAuthenticated(true);
        
        if (authData) {
          try {
            const parsedAuthData = JSON.parse(authData);
            setUser({
              ...parsedAuthData,
              isAuthenticated: true
            });
          } catch (error) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              setUser({
                id: payload.id || payload.sub,
                hospitalId: payload.hospitalId,
                role: payload.role,
                roleId: payload.roleId,
                name: payload.name || payload.hospitalName || 'User',
                email: payload.email || '',
                phone: payload.phone || '',
                isAuthenticated: true
              });
            } catch (jwtError) {
              setUser({ isAuthenticated: true });
            }
          }
        } else {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({
              id: payload.id || payload.sub,
              hospitalId: payload.hospitalId,
              role: payload.role,
              roleId: payload.roleId,
              name: payload.name || payload.hospitalName || 'User',
              email: payload.email || '',
              phone: payload.phone || '',
              isAuthenticated: true
            });
          } catch (jwtError) {
            setUser({ isAuthenticated: true });
          }
        }
      } else {
        if (token && isTokenExpired(token)) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('authData');
        }
        setIsAuthenticated(false);
        setUser(null);
      }
      
      setLoading(false);
    };
    
    checkAuth();
    
    // Check token expiry every 5 minutes
    const interval = setInterval(() => {
      const token = localStorage.getItem('accessToken');
      if (token && isTokenExpired(token)) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authData');
        setIsAuthenticated(false);
        setUser(null);
        window.location.href = '/sign-in';
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const login = (userData) => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      return;
    }
    
    localStorage.setItem('authData', JSON.stringify(userData));
    
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authData');
    localStorage.removeItem('permissions');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    localStorage.removeItem('roleId');
    localStorage.removeItem('hospitalInfo');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated,
    getToken: () => localStorage.getItem('accessToken'),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};