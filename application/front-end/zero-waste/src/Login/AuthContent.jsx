import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const navigate = useNavigate();

  const [user, setUser] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem("accessToken"));
  

  const login = async (email, password) => {
    try {
      const res = await fetch(`${apiUrl}/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email, password })          // 🔁 or { username, password }
      });
      
      // --- Read safely -------------------------------------------------
      const raw = await res.text();                        // read once
      const isJson = res.headers
        .get("content-type")
        ?.includes("application/json");
  
      const data = isJson && raw ? JSON.parse(raw) : {};   // parse only if safe
      console.log(data)
      // ----------------------------------------------------------------
  
      if (!res.ok) {
        // Expose backend message (if any) so UI can show it
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      console.log(JSON.stringify({ email, password }))
      // At this point the request was 2xx ------------------------------
      if (data?.token?.access) {                // ① safest guard
        localStorage.setItem("accessToken",     // ② explicit key name
                             data.token.access);
        setToken(data.token.access);
      
        // If the API also returns user details, keep them;
        // otherwise fall back to { email }
        setUser(data.user ?? { email });
        return { success: true, isAdmin: data.isAdmin };
      }

  
      throw new Error("Token missing in response");
    } catch (err) {
      console.error("Login error:", err.message);
      return false;
    }
  };
 

  const signup= async (email,username, password) => {
    

    try {
      const response = await fetch(`${apiUrl}/signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, username, password }),
      });
      
      const data = await response.json();
      console.log(JSON.stringify({ email, username, password }))
      
      return data

    } catch (err) {
      console.error("Signup error:", err.message);
      return false
    }
    //return true if sign up is succesful
    if(data && data.response==="ok"){
      console.log("true")
      return true
      
    }
    //else return false
    console.log("false")
    return false
    
    
  };

  const logout = () => setUser(null);

  const value = { token, login, signup, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export default AuthProvider
