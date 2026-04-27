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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentHospital, setCurrentHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated') === 'true';
    const hospital = JSON.parse(localStorage.getItem('currentHospital') || 'null');
    
    console.log("Initial auth check - isAuthenticated:", auth);
    setIsAuthenticated(auth);
    setCurrentHospital(hospital);
    setLoading(false);
  }, []);

  const login = (hospital) => {
    console.log("Login called for hospital:", hospital.email);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('currentHospital', JSON.stringify(hospital));
    setIsAuthenticated(true);
    setCurrentHospital(hospital);
  };

  const logout = () => {
    console.log("Logout called - clearing localStorage");
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentHospital');
    setIsAuthenticated(false);
    setCurrentHospital(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      currentHospital, 
      loading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};