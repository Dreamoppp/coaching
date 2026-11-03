import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  switchRole: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('ace_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('ace_access_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('ace_user', JSON.stringify(res.data.user));
        } catch (error) {
          localStorage.removeItem('ace_access_token');
          localStorage.removeItem('ace_refresh_token');
          localStorage.removeItem('ace_user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    fetchMe();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, accessToken, refreshToken } = res.data;
    localStorage.setItem('ace_access_token', accessToken);
    localStorage.setItem('ace_refresh_token', refreshToken);
    localStorage.setItem('ace_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('ace_access_token');
    localStorage.removeItem('ace_refresh_token');
    localStorage.removeItem('ace_user');
    setUser(null);
  };

  const switchRole = async (targetRole: Role) => {
    let email = 'admin@aceacademy.edu';
    if (targetRole === 'TEACHER') email = 'rajesh.sharma@aceacademy.edu';
    if (targetRole === 'STUDENT') email = 'aarav.mehta@student.aceacademy.edu';

    await login(email, 'Ace@12345');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

