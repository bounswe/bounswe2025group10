import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AuthContextType, User } from "../types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem("user");
    return cached ? (JSON.parse(cached) as User) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login: AuthContextType["login"] = (email: string, _password: string) => {
    // TODO: Replace with real API call
    setUser({ email });
    navigate("/");
  };

  const signup: AuthContextType["signup"] = (email: string, _password: string) => {
    // TODO: Replace with real API call
    setUser({ email });
    navigate("/");
  };

  const logout: AuthContextType["logout"] = () => setUser(null);

  const value: AuthContextType = { user, login, signup, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};