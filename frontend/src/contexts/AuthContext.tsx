import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'superadmin' | 'admin' | 'po' | 'readonly';
  team_ids: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPO: boolean;
  isReadOnly: boolean;
  canEdit: boolean;          // admin or po
  canManageUsers: boolean;   // admin only
  isAssignedTeam: (teamId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAuthHeader = (token: string) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const clearAuth = () => {
    localStorage.removeItem('amadeus_access_token');
    localStorage.removeItem('amadeus_refresh_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const fetchMe = useCallback(async (token: string): Promise<AuthUser | null> => {
    try {
      setAuthHeader(token);
      const res = await axios.get(`${API}/api/auth/me`);
      return res.data;
    } catch {
      return null;
    }
  }, []);

  // On mount — restore session from localStorage
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('amadeus_access_token');
      if (!token) { setIsLoading(false); return; }
      const me = await fetchMe(token);
      if (me) {
        setUser(me);
      } else {
        // Try refresh
        const refresh = localStorage.getItem('amadeus_refresh_token');
        if (refresh) {
          try {
            const res = await axios.post(`${API}/api/auth/refresh`,
              { refresh_token: refresh });
            const newToken = res.data.access_token;
            localStorage.setItem('amadeus_access_token', newToken);
            localStorage.setItem('amadeus_refresh_token', res.data.refresh_token);
            const me2 = await fetchMe(newToken);
            if (me2) setUser(me2);
            else clearAuth();
          } catch { clearAuth(); }
        } else { clearAuth(); }
      }
      setIsLoading(false);
    };
    init();
  }, [fetchMe]);

  const login = async (username: string, password: string) => {
    const res = await axios.post(`${API}/api/auth/login`, { username, password });
    const { access_token, refresh_token } = res.data;
    localStorage.setItem('amadeus_access_token', access_token);
    localStorage.setItem('amadeus_refresh_token', refresh_token);
    setAuthHeader(access_token);
    const me = await fetchMe(access_token);
    if (me) setUser(me);
  };

  const logout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin    = user?.role === 'admin' || isSuperAdmin;
  const isPO       = user?.role === 'po';
  const isReadOnly = user?.role === 'readonly';
  const canEdit    = isAdmin || isPO;
  const canManageUsers = isAdmin;

  const isAssignedTeam = (teamId: string) => {
    if (isAdmin) return true;
    return user?.team_ids?.includes(teamId) ?? false;
  };

  return (
    <AuthContext.Provider value={{
      user, isLoading,
      isAuthenticated: !!user,
      login, logout,
      isAdmin, isSuperAdmin, isPO, isReadOnly,
      canEdit, canManageUsers,
      isAssignedTeam,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
