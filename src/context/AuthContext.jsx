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
    const expired = payload.exp * 1000 < Date.now();
    
    if (expired) {
      console.log("⏰ Token expired at:", new Date(payload.exp * 1000));
    }
    
    return expired;
  } catch (error) {
    console.error("Error checking token expiry:", error);
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
      
      console.log("🔍 Checking authentication...");
      console.log("Token exists:", !!token);
      console.log("AuthData exists:", !!authData);
      
      if (token && !isTokenExpired(token)) {
        setIsAuthenticated(true);
        
        // ✅ FIRST: Try to restore from authData (complete user object)
        if (authData) {
          try {
            const parsedAuthData = JSON.parse(authData);
            console.log("✅ Restored user from authData:", parsedAuthData);
            setUser({
              ...parsedAuthData,
              isAuthenticated: true
            });
          } catch (error) {
            console.error("Error parsing authData:", error);
            // Fallback to JWT
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
              console.error("Error parsing JWT:", jwtError);
              setUser({ isAuthenticated: true });
            }
          }
        } else {
          // ✅ Fallback: Build user from JWT
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log("🔑 Built user from JWT:", payload);
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
            console.error("Error parsing JWT:", jwtError);
            setUser({ isAuthenticated: true });
          }
        }
        
        console.log("✅ User authenticated via valid token");
      } else {
        if (token && isTokenExpired(token)) {
          console.log("⚠️ Token expired, clearing localStorage");
          localStorage.removeItem('accessToken');
          localStorage.removeItem('authData');
        }
        setIsAuthenticated(false);
        setUser(null);
        console.log("❌ No valid token found");
      }
      
      setLoading(false);
    };
    
    checkAuth();
    
    // Check token expiry every 5 minutes
    const interval = setInterval(() => {
      const token = localStorage.getItem('accessToken');
      if (token && isTokenExpired(token)) {
        console.log("⏰ Token expired during session, logging out");
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
    console.log("🔐 AuthContext - login called with:", userData);
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error("❌ No token found during login!");
      return;
    }
    
    // ✅ Store authData in localStorage for persistence
    localStorage.setItem('authData', JSON.stringify(userData));
    console.log("💾 AuthData saved to localStorage");
    
    setIsAuthenticated(true);
    setUser(userData);
    console.log("✅ Login state updated in AuthContext");
  };

  const logout = () => {
    console.log("🚪 AuthContext - logout called");
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
    console.log("✅ All auth data cleared");
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