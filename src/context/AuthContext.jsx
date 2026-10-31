import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState({
    name: 'Rahim Chowdhury',
    email: 'r.chowdhury@telepulse.ai',
    role: 'Senior NOC Specialist',
    organization: 'ORG-001 • Dhaka Metro NOC',
    avatar: 'RC',
  });

  const login = (role = 'Senior NOC Specialist') => {
    setUser({
      name: 'Rahim Chowdhury',
      email: 'r.chowdhury@telepulse.ai',
      role,
      organization: 'ORG-001 • Dhaka Metro NOC',
      avatar: 'RC',
    });
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

