import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, clearToken } from '../utils/api';

export interface AuthUser {
  id: string;
  username: string;
  role: 'guru' | 'siswa';
  name: string;
  className: string;
  nis?: string;
  schoolName?: string;
  semester?: string;
  avatarEmoji?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((u: any) => setUser(u))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    setError(null);
    try {
      const { token, user: u } = await api.login(username, password);
      setToken(token);
      setUser(u);
    } catch (e: any) {
      setError(e.message || 'Login gagal.');
      throw e;
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
