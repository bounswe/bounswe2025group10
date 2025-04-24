import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const login = async (email, password) => {
    try {
      const response = await fetch("http://134.209.253.215:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem("token", data.token); // ✅ Save to localStorage
        setToken(data.token);
        setUser(email);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error("Login error:", err.message);
      return false;
    }
  };
  const signup = async (email, username, _password) => {
    try {
      const response = await fetch("http://134.209.253.215:8000/signup", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, username, _password }),
      });

      const data = await response.json();
    } catch (err) {
      console.error("Signup error:", err.message);
    }
    navigate("/");
  };

  const logout = () => setUser(null);

  const value = { token, login, signup, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
