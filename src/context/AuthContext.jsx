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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      const authData = localStorage.getItem('authData');
      
      if (token) {
        setIsAuthenticated(true);
        
        if (authData) {
          try {
            const parsedAuthData = JSON.parse(authData);
            setUser({
              ...parsedAuthData,
              isAuthenticated: true
            });
          } catch (error) {
            // If authData is corrupted, try to parse from token
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
          // No authData, try to parse from token
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
        setIsAuthenticated(false);
        setUser(null);
      }
      
      setLoading(false);
    };
    
    checkAuth();
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