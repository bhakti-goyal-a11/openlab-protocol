import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../api/client';

const AuthContext = createContext(null);

export const DEMO_USERS = [
  {
    name: 'Alex Chen',
    email: 'alex.chen@campus.edu',
    role: 'STUDENT',
    dept: 'Computer Science & AI',
    desc: 'High Trust (95), GPU & SLA 3D certified, 0 no-shows'
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@campus.edu',
    role: 'STUDENT',
    dept: 'Mechanical Prototyping',
    desc: 'Fairness (8.1), 5-Axis CNC lead, Formula SAE team'
  },
  {
    name: 'Jordan Taylor',
    email: 'jordan.taylor@campus.edu',
    role: 'STUDENT',
    dept: 'Precision Electronics',
    desc: 'TrustScore (70), 1 past no-show (Probation demo)'
  },
  {
    name: 'Dr. Marcus Vance',
    email: 'marcus.vance@campus.edu',
    role: 'LAB_CUSTODIAN',
    dept: 'CS & AI Research Facility',
    desc: 'Manages DGX H100 cluster, approves credentials'
  },
  {
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@campus.edu',
    role: 'LAB_CUSTODIAN',
    dept: 'Mechanical Engineering',
    desc: 'Manages CNC Mills, Lasers, resolves disputes'
  },
  {
    name: 'Dean Eleanor Wright',
    email: 'eleanor.wright@campus.edu',
    role: 'ADMIN',
    dept: 'Institutional Dean / Provost',
    desc: 'Reviews CapEx Duplication & Tamper-Evident Ledger'
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getAuthToken());
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (getAuthToken()) {
        const userData = await api.getMe();
        setUser(userData);
      } else {
        // Auto-login Alex Chen by default for instantaneous zero-friction demo experience!
        await switchDemoUser('alex.chen@campus.edu');
      }
    } catch (err) {
      console.warn('Could not load session, defaulting to Alex Chen:', err);
      try {
        await switchDemoUser('alex.chen@campus.edu');
      } catch (e) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setAuthToken(res.access_token);
    setToken(res.access_token);
    const fullUser = await api.getMe();
    setUser(fullUser);
    return fullUser;
  };

  const register = async (payload) => {
    const res = await api.register(payload);
    setAuthToken(res.access_token);
    setToken(res.access_token);
    const fullUser = await api.getMe();
    setUser(fullUser);
    return fullUser;
  };

  const switchDemoUser = async (email) => {
    setLoading(true);
    try {
      const res = await api.switchDemoUser(email);
      setAuthToken(res.access_token);
      setToken(res.access_token);
      const fullUser = await api.getMe();
      setUser(fullUser);
      return fullUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (getAuthToken()) {
      const fullUser = await api.getMe();
      setUser(fullUser);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      switchDemoUser,
      refreshUser,
      demoUsers: DEMO_USERS
    }}>
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
