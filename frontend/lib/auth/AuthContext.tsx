"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/auth';
import { getAuthToken } from '../api/client';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch (err) {
        if (err instanceof TypeError) {
          // Network error (backend unreachable) — keep the token, don't log as error
          console.warn('Could not reach backend to verify session, will retry on next navigation.');
        } else {
          console.error('Failed to load user session', err);
          localStorage.removeItem('token');
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
