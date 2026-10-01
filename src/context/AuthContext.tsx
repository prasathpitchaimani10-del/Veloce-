import React, { createContext, useContext, useState, useEffect } from 'react';
import { SafeUser } from '../types/index.ts';
import { api, getStoredToken, setStoredToken } from '../api/client.ts';

interface AuthContextType {
  user: SafeUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<{ success: boolean; message?: string }>;
  quickLogin: (role: 'customer' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        } else {
          setStoredToken(null);
          setUser(null);
        }
      } catch {
        setStoredToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (res.success && res.data) {
      setStoredToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, message: res.message || 'Login failed.' };
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.register(name, email, password);
    if (res.success && res.data) {
      setStoredToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, message: res.message || 'Registration failed.' };
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setStoredToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (name: string) => {
    const res = await api.updateProfile(name);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, message: res.message };
  };

  const quickLogin = async (role: 'customer' | 'admin') => {
    if (role === 'customer') {
      await login('alex@example.com', 'password123');
    } else {
      await login('admin@veloce.com', 'admin123');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        quickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
