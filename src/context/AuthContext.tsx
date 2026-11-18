import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { civicApi } from '../lib/civicApi';
import type { UserProfile } from '../types/civic';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (input: { email: string; password: string; portal?: 'citizen' | 'admin' }) => Promise<UserProfile>;
  register: (input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const current = await civicApi.getCurrentUser();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (input: { email: string; password: string; portal?: 'citizen' | 'admin' }) => {
      const profile = await civicApi.login(input);
      setUser(profile);
      return profile;
    },
    [],
  );

  const register = useCallback(
    async (input: {
      fullName: string;
      email: string;
      password: string;
      phone?: string;
      address?: string;
    }) => {
      const profile = await civicApi.register(input);
      setUser(profile);
      return profile;
    },
    [],
  );

  const logout = useCallback(async () => {
    await civicApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return ctx;
}
