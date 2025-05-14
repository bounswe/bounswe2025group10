import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { toBoolean } from "@/util/helper.js";

// Create Auth context
export const AuthContext = createContext(null);

// Hook to use Auth context
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

  const [token, setToken] = useState(() =>
    localStorage.getItem(ACCESS_TOKEN_KEY)
  );
  const [isAdmin, setIsAdmin] = useState(() =>
    toBoolean(localStorage.getItem(ADMIN_KEY))
  );

  const saveToken = useCallback((newToken, isAdminFlag) => {
    setToken(newToken);
    setIsAdmin(isAdminFlag);
    if (newToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
      localStorage.setItem(ADMIN_KEY, isAdminFlag);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(ADMIN_KEY);
    }
  }, []);

  const safeJson = async (response) => {
    const text = await response.text();
    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");
    return isJson && text ? JSON.parse(text) : null;
  };

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

  const signup = useCallback(
    async (email, username, password) => {
      try {
        const response = await fetch(`${apiUrl}/signup/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, username, password }),
        });

        const data = await safeJson(response);
        if (!response.ok)
          throw new Error(data?.message ?? `HTTP ${response.status}`);

        return { success: true, message: "Account created successfully!" };
      } catch (err) {
        console.error("Signup failed:", err);
        return { success: false, message: err.message };
      }
    },
    [apiUrl]
  );

  const logout = useCallback(() => {
    saveToken(null, null);
    navigate("/login", { replace: true });
  }, [navigate, saveToken]);

  // When the application loads, read the token and admin flag from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedAdmin = toBoolean(localStorage.getItem(ADMIN_KEY));
    if (storedToken) {
      setToken(storedToken);
      setIsAdmin(storedAdmin);
    }
  }, []);

  // Update localStorage whenever the token or isAdmin changes
  useEffect(() => {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_KEY, isAdmin);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(ADMIN_KEY);
    }
  }, [token, isAdmin]);

  const value = {
    isAdmin,
    token,
    isAuthenticated: Boolean(token),
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
