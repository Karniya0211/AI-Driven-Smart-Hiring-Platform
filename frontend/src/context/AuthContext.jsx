import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('ai_matcher_token') || sessionStorage.getItem('ai_matcher_token');

      if (!savedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const me = await api.getMe();
        if (me && me.user) {
          setUser(me.user);
          localStorage.setItem('ai_matcher_token', savedToken);
          sessionStorage.setItem('ai_matcher_token', savedToken);
        } else {
          localStorage.removeItem('ai_matcher_token');
          sessionStorage.removeItem('ai_matcher_token');
          setUser(null);
        }
      } catch (error) {
        localStorage.removeItem('ai_matcher_token');
        sessionStorage.removeItem('ai_matcher_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res.user && res.token) {
        localStorage.setItem('ai_matcher_token', res.token);
        sessionStorage.setItem('ai_matcher_token', res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || "Invalid email or password" };
    } catch (error) {
      return { success: false, error: error.message || "Authentication service unavailable." };
    }
  };

  const register = async (email, password, full_name, role) => {
    try {
      const res = await api.register(email, password, full_name, role);
      if (res.user && res.token) {
        localStorage.setItem('ai_matcher_token', res.token);
        sessionStorage.setItem('ai_matcher_token', res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || "Unable to create account" };
    } catch (error) {
      return { success: false, error: error.message || "Authentication service unavailable." };
    }
  };

  const logout = () => {
    localStorage.removeItem('ai_matcher_token');
    sessionStorage.removeItem('ai_matcher_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
