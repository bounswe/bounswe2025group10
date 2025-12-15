import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthContext";
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";
import { showToast } from "../../utils/toast.js";

import LandingNavbar from "../../components/layout/LandingNavbar";

export default function LoginPage() {
  const { login } = useAuth();
  const { currentTheme, theme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { success, isAdmin, message } = await login(email, password);

      if (success) {
        showToast(t("auth.loginSuccess", "Login successful! Redirecting…"), "success", 2000);
        const target = isAdmin ? "/adminPage" : "/mainPage";
        setTimeout(() => navigate(target), 1500);
      } else {
        showToast(`${t("auth.loginFailed", "Login failed")}: ${message ?? "unknown error"}`, "error", 3000);
        setLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      showToast(t("auth.loginFailed", "Login failed"), "error", 3000);
      setLoading(false);
    }
  };

  return (
    <LandingNavbar active="login">
      <div
        className="min-h-full flex items-center justify-center p-4 transition-colors duration-300"
        style={{ backgroundColor: currentTheme.background }}
      >
        <div
          className="w-full max-w-md rounded-2xl shadow-xl p-8 border transition-colors duration-300"
          style={{
            backgroundColor: currentTheme.background,
            borderColor: currentTheme.border
          }}
        >
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: currentTheme.secondary }}
            >
              {t("auth.loginTitle", "Login")}
            </h1>
            <p
              className="text-sm opacity-80"
              style={{ color: currentTheme.text }}
            >
              {t("common.welcome")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: currentTheme.text }}
              >
                {t("email", "Email")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-all"
                style={{
                  backgroundColor: currentTheme.background,
                  color: currentTheme.text,
                  borderColor: currentTheme.border,
                }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: currentTheme.text }}
              >
                {t("password", "Password")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-all pr-12"
                  style={{
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                    borderColor: currentTheme.border,
                  }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  style={{ color: currentTheme.text }}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold shadow-md transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
              style={{
                backgroundColor: currentTheme.secondary,
                color: theme === 'highContrast' ? '#000000' : (currentTheme.primaryText || '#ffffff')
              }}
            >
              {loading && (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? t("auth.loggingIn", "Logging in...") : t("auth.loginTitle", "Login")}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm" style={{ color: currentTheme.text }}>
              {t("auth.noAccount", "Don't have an account?")}{" "}
              <Link
                to="/signup"
                className="font-semibold hover:underline"
                style={{ color: currentTheme.secondary }}
              >
                {t("auth.signupTitle", "Sign Up")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </LandingNavbar>
  );
}
