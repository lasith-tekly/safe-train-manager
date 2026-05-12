import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE } from '../config/api';

// Module-level variable for axios interceptor to access
let currentTrainId: string | null = null;

export const setCurrentTrainId = (trainId: string | null) => {
  currentTrainId = trainId;
};

// Set axios headers synchronously on module load
const storedToken = localStorage.getItem('amadeus_access_token');
const storedTrainId = localStorage.getItem('selectedTrainId');
if (storedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}
if (storedTrainId) {
  currentTrainId = storedTrainId;
  axios.defaults.headers.common['X-Train-Context'] = storedTrainId;
}

export interface TrainAssignment {
  id: string;
  train_id: string;
  train_name: string;
  train_short_code: string;
  role: 'admin' | 'po' | 'readonly';
  is_default: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;                          // global role
  train_id: string | null;               // kept for backward compatibility
  trains: TrainAssignment[];             // NEW — all assigned trains
  team_ids: string[];
  must_change_password: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;

  // Train context — NEW
  selectedTrainId: string | null;
  selectedTrainRole: string | null;
  switchTrain: (trainId: string | null) => void;

  // Role helpers — updated to use per-train role
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPO: boolean;
  isReadOnly: boolean;
  canEdit: boolean;
  canManageUsers: boolean;
  mustChangePassword: boolean;
  isAssignedTeam: (teamId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(() => {
    // Load from localStorage on init
    return localStorage.getItem('selectedTrainId') || null;
  });

  const queryClient = useQueryClient();

  const setAuthHeader = (token: string) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const setTrainContextHeader = (trainId: string | null) => {
    if (trainId) {
      axios.defaults.headers.common['X-Train-Context'] = trainId;
    } else {
      delete axios.defaults.headers.common['X-Train-Context'];
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('amadeus_access_token');
    localStorage.removeItem('amadeus_refresh_token');
    localStorage.removeItem('selectedTrainId');
    delete axios.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['X-Train-Context'];
    currentTrainId = null;
    setUser(null);
    setSelectedTrainId(null);
  };

  const fetchMe = useCallback(async (token: string): Promise<AuthUser | null> => {
    try {
      setAuthHeader(token);
      const res = await axios.get(`${API_BASE}/api/auth/me`);
      return res.data;
    } catch {
      return null;
    }
  }, []);

  // Get role for currently selected train
  const selectedTrainRole = useMemo(() => {
    if (!user) return null;
    if (user.role === 'superadmin') return 'admin'; // superadmin = admin everywhere
    if (!selectedTrainId || !user.trains) return null;
    const assignment = user.trains.find(
      t => t.train_id === selectedTrainId
    );
    return assignment?.role || null;
  }, [user, selectedTrainId]);

  // Role boolean helpers
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = isSuperAdmin || user?.role === 'admin';
  const isPO = !isAdmin && user?.role === 'po';
  const isReadOnly = !isAdmin && !isPO && user?.role === 'readonly';
  const canEdit = isAdmin || isPO;
  const canManageUsers = isSuperAdmin;
  const mustChangePassword = user?.must_change_password ?? false;

  const isAssignedTeam = useCallback((teamId: string) => {
    if (isAdmin || isSuperAdmin) return true;
    return user?.team_ids?.includes(teamId) ?? false;
  }, [isAdmin, isSuperAdmin, user?.team_ids]);

  const switchTrain = useCallback((trainId: string | null) => {
    setCurrentTrainId(trainId);
    setSelectedTrainId(trainId);
    setTrainContextHeader(trainId);
    if (trainId) {
      localStorage.setItem('selectedTrainId', trainId);
    } else {
      localStorage.removeItem('selectedTrainId');
    }
    // Invalidate all React Query cache so data refreshes
    queryClient.invalidateQueries();
  }, [queryClient]);

  // On mount — restore session from localStorage
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('amadeus_access_token');
      if (!token) { setIsLoading(false); return; }
      const me = await fetchMe(token);
      if (me) {
        setUser(me);
        // Restore selectedTrainId if user still has access
        const stored = localStorage.getItem('selectedTrainId');
        if (stored && me.trains?.some(t => t.train_id === stored)) {
          setSelectedTrainId(stored);
          setCurrentTrainId(stored);
          setTrainContextHeader(stored);
        } else if (me.trains?.length > 0) {
          // Set to default or first train
          const defaultTrain = me.trains.find(t => t.is_default)?.train_id || me.trains[0].train_id;
          setSelectedTrainId(defaultTrain);
          setCurrentTrainId(defaultTrain);
          setTrainContextHeader(defaultTrain);
          localStorage.setItem('selectedTrainId', defaultTrain);
        }
      } else {
        // Try refresh
        const refresh = localStorage.getItem('amadeus_refresh_token');
        if (refresh) {
          try {
            const res = await axios.post(`${API_BASE}/api/auth/refresh`,
              { refresh_token: refresh });
            const newToken = res.data.access_token;
            localStorage.setItem('amadeus_access_token', newToken);
            localStorage.setItem('amadeus_refresh_token', res.data.refresh_token);
            const me2 = await fetchMe(newToken);
            if (me2) {
              setUser(me2);
              // Set selectedTrainId for refreshed session
              const stored = localStorage.getItem('selectedTrainId');
              if (stored && me2.trains?.some(t => t.train_id === stored)) {
                setSelectedTrainId(stored);
                setCurrentTrainId(stored);
                setTrainContextHeader(stored);
              } else if (me2.trains?.length > 0) {
                const defaultTrain = me2.trains.find(t => t.is_default)?.train_id || me2.trains[0].train_id;
                setSelectedTrainId(defaultTrain);
                setCurrentTrainId(defaultTrain);
                setTrainContextHeader(defaultTrain);
                localStorage.setItem('selectedTrainId', defaultTrain);
              }
            } else {
              clearAuth();
            }
          } catch { clearAuth(); }
        } else { clearAuth(); }
      }
      setIsLoading(false);
    };
    init();
  }, [fetchMe]);

  const login = async (username: string, password: string) => {
    const res = await axios.post(`${API_BASE}/api/auth/login`, { username, password });
    const { access_token, refresh_token, must_change_password, trains } = res.data;
    localStorage.setItem('amadeus_access_token', access_token);
    localStorage.setItem('amadeus_refresh_token', refresh_token);
    setAuthHeader(access_token);
    const me = await fetchMe(access_token);

    if (must_change_password) {
      window.location.href = '/change-password';
      return;
    }

    if (me) {
      setUser(me);

      // Superadmin → User Management
      if (me.role === 'superadmin') {
        window.location.href = '/settings/users';
        return;
      }

      // No trains → No Access page
      if (!trains || trains.length === 0) {
        window.location.href = '/no-access';
        return;
      }

      // Single train → auto-select and go to dashboard
      if (trains.length === 1) {
        const trainId = trains[0].train_id;
        setSelectedTrainId(trainId);
        setCurrentTrainId(trainId);
        setTrainContextHeader(trainId);
        localStorage.setItem('selectedTrainId', trainId);
        window.location.href = '/';
        return;
      }

      // Multiple trains → show train selection screen
      window.location.href = '/select-train';
    }
  };

  const logout = useCallback(() => {
    clearAuth();
    window.location.href = '/login';
  }, []);

  const sessionExpired = useCallback(() => {
    clearAuth();
    window.location.href = '/login?reason=expired';
  }, []);

  // Axios interceptors
  useEffect(() => {
    // Request interceptor to add X-Train-Context header
    const requestInterceptor = axios.interceptors.request.use(
      config => {
        if (currentTrainId) {
          config.headers['X-Train-Context'] = currentTrainId;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor for auto-refresh on 401
    const responseInterceptor = axios.interceptors.response.use(
      res => res,
      async err => {
        const originalRequest = err.config;
        if (err.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refresh = localStorage.getItem('amadeus_refresh_token');
            if (!refresh) { sessionExpired(); return Promise.reject(err); }
            const res = await axios.post(
              `${API_BASE}/api/auth/refresh`,
              { refresh_token: refresh }
            );
            const newToken = res.data.access_token;
            localStorage.setItem('amadeus_access_token', newToken);
            localStorage.setItem('amadeus_refresh_token',
              res.data.refresh_token);
            axios.defaults.headers.common['Authorization'] =
              `Bearer ${newToken}`;
            originalRequest.headers['Authorization'] =
              `Bearer ${newToken}`;
            // Preserve train context on refresh
            if (currentTrainId) {
              originalRequest.headers['X-Train-Context'] = currentTrainId;
            }
            return axios(originalRequest);
          } catch {
            sessionExpired();
            return Promise.reject(err);
          }
        }
        return Promise.reject(err);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [logout, sessionExpired]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,

      // Train context
      selectedTrainId,
      selectedTrainRole,
      switchTrain,

      // Role helpers
      isAdmin,
      isSuperAdmin,
      isPO,
      isReadOnly,
      canEdit,
      canManageUsers,
      mustChangePassword,
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
