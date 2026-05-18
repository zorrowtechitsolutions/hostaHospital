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
      console.log("Token expired at:", new Date(payload.exp * 1000));
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
      
      console.log("🔍 Checking authentication...");
      console.log("Token exists:", !!token);
      
      if (token && !isTokenExpired(token)) {
        setIsAuthenticated(true);
        
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({
            id: payload.id || payload.sub,
            email: payload.email,
            name: payload.name || payload.hospitalName,
            isAuthenticated: true
          });
        } catch (error) {
          setUser({ isAuthenticated: true });
        }
        
        console.log("✅ User authenticated via valid token");
      } else {
        if (token && isTokenExpired(token)) {
          console.log("⚠️ Token expired, clearing localStorage");
          localStorage.removeItem('accessToken');
        }
        setIsAuthenticated(false);
        setUser(null);
        console.log("❌ No valid token found");
      }
      
      setLoading(false);
    };
    
    checkAuth();
    
    const interval = setInterval(() => {
      const token = localStorage.getItem('accessToken');
      if (token && isTokenExpired(token)) {
        console.log("Token expired during session, logging out");
        localStorage.removeItem('accessToken');
        setIsAuthenticated(false);
        setUser(null);
        window.location.href = '/sign-in';
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const login = (userData) => {
    console.log("AuthContext - login called with:", userData);
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error("No token found during login!");
      return;
    }
    
    setIsAuthenticated(true);
    setUser(userData);
    console.log("✅ Login state updated in AuthContext");
  };

  const logout = () => {
    console.log("AuthContext - logout called");
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('accessToken');
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