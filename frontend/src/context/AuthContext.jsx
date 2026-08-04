import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/endpoints";
import { setToken, clearToken, getToken } from "../utils/authToken";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    // No token stored for this specific tab -> treat it as logged out,
    // even if a login cookie from another tab/session still exists in the
    // browser. This is what keeps a freshly opened tab from inheriting
    // whichever user last logged in elsewhere in the same browser.
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.getMe();
      setUser(data.data.user);
    } catch {
      setUser(null);
      clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearToken();
      setUser(null);
    }
  };

  const value = { user, setUser, loading, login, logout, refresh: fetchMe };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
