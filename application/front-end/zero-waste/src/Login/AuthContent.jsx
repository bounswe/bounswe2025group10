import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import {toBoolean} from "@/util/helper.js";

/**
 * Authentication context for the application.
 * Provides token, user data and convenient auth helpers.
 */
const AuthContext = createContext(null);

/**
 * Convenience hook so consumers don’t need to import useContext + AuthContext.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};

const ACCESS_TOKEN_KEY = "accessToken";
const ADMIN_KEY = "isAdmin";

export function AuthProvider({ children }) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  /**
   * Persist token in localStorage so users stay logged‑in after refresh.
   */
  const [token, setToken] = useState(() =>
      localStorage.getItem(ACCESS_TOKEN_KEY)
  );
  const [isAdmin, setIsAdmin] = useState(() =>
      toBoolean(localStorage.getItem(ADMIN_KEY))
  );

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Centralised place to update / remove token + localStorage.
   */
  const saveToken = useCallback((newToken, isAdmin) => {
    setToken(newToken);
    setIsAdmin(isAdmin);
    if (newToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
      localStorage.setItem(ADMIN_KEY, isAdmin);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(ADMIN_KEY);
    }
  }, []);

  /**
   * Parse JSON safely – avoids exceptions on non‑JSON responses.
   */
  const safeJson = async (response) => {
    const text = await response.text();
    const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");
    return isJson && text ? JSON.parse(text) : null;
  };

  /* ------------------------------------------------------------------ */
  /* Auth API wrappers                                                   */
  /* ------------------------------------------------------------------ */

  /**
   * Log in with credentials. Returns { success, message?, isAdmin? }.
   */
  const login = useCallback(
      async (email, password) => {
        if (!email || !password) {
          return { success: false, message: "Missing email or password" };
        }
        try {
          const res = await fetch(`${apiUrl}/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const data = await safeJson(res);
          if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);

          const access = data?.token?.access;
          if (!access) throw new Error("Missing access token");

          saveToken(access, data.isAdmin ?? false);
          return { success: true, isAdmin: data.isAdmin ?? false };
        } catch (err) {
          console.error("Login failed:", err);
          return { success: false, message: err.message };
        }
      },
      [apiUrl, saveToken]
  );

  /**
   * Register a new account. Returns { success, message? }.
   */
  const signup = useCallback(
      async (email, username, password) => {
        try {
          const res = await fetch(`${apiUrl}/signup/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, username, password }),
          });

          const data = await safeJson(res);
          if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`);

          return { success: true, message: "Account created successfully!" };
        } catch (err) {
          console.error("Signup failed:", err);
          return { success: false, message: err.message };
        }
      },
      [apiUrl]
  );

  /**
   * Clear auth state and redirect to login.
   */
  const logout = useCallback(() => {
    saveToken(null, null);
    navigate("/login", { replace: true });
  }, [navigate, saveToken]);

  const value = {
    isAdmin,
    token,
    isAuthenticated : Boolean(token),
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
