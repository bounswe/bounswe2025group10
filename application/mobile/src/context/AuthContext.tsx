import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { authService, AuthResponse } from '../services/api';

interface UserData {
  email: string;
  username: string;
  profile_picture?: string; // URL or relative path to profile picture
  isAdmin?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userData: UserData | null;
  login: (email: string, password: string) => Promise<AuthResponse | null>;
  logout: () => Promise<void>;
  fetchUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  const fetchUserData = async () => {
    try {
      const data = await authService.getUserInfo();
      console.log('Fetched user data:', JSON.stringify(data, null, 2));
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = await storage.getToken();
      const adminStatus = await storage.getAdminStatus();
      setIsAuthenticated(!!token);
      setIsAdmin(adminStatus);
      if (token) {
        await fetchUserData();
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Starting login process...');
      const response = await authService.login({ email, password });
      console.log('Login response received:', response);
      
      if (response.token) {
        console.log('Saving tokens to storage...');
        await storage.setToken(response.token.access);
        await storage.setRefreshToken(response.token.refresh);
        
        // Save admin status
        if (response.isAdmin !== undefined) {
          await storage.setAdminStatus(response.isAdmin);
          setIsAdmin(response.isAdmin);
        }
        
        // Verify token was saved
        const savedToken = await storage.getToken();
        console.log('Token saved successfully:', savedToken ? 'Yes' : 'No');
        
        setIsAuthenticated(true);
        await fetchUserData();
        return response;
      } else {
        console.log('No token in response:', response);
        return null;
      }
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      return null;
    }
  };

  const logout = async () => {
    await storage.clearTokens();
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, userData, login, logout, fetchUserData }}>
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
