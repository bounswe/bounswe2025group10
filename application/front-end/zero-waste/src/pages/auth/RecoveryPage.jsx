import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { settingsService } from "../../services/settingsService";
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";
import { showToast } from "../../utils/toast.js";

import LandingNavbar from "../../components/layout/LandingNavbar";

export default function RecoveryPage() {
  const navigate = useNavigate();
  const { currentTheme, theme } = useTheme();
  const { t } = useLanguage();
  
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // 'success' | 'deleted' | null

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      // Calls the public endpoint to cancel deletion
      const res = await settingsService.cancelDeletionByToken(token);

      if (res.status === 'canceled') {
        setResult('success');
        showToast(t("auth.recoverSuccess", "Account restored successfully!"), "success", 2000);
      } else if (res.status === 'deleted') {
        setResult('deleted');
      }
    } catch (err) {
      console.error(err);
      showToast(t("auth.recoverError", "Invalid token or network error."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LandingNavbar active="recovery">
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
          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: currentTheme.secondary }}
            >
              {t("auth.recoverTitle", "Recover Account")}
            </h1>
            <p
              className="text-sm opacity-80"
              style={{ color: currentTheme.text }}
            >
              {t("auth.recoverSubtitle", "Restore your zero-waste journey ♻️")}
            </p>
          </div>

          {/* 1. Success State */}
          {result === 'success' ? (
            <div className="text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <div>
                <h4 className="text-xl font-bold mb-2" style={{ color: currentTheme.secondary }}>
                  {t("auth.reactivatedTitle", "Account Reactivated!")}
                </h4>
                <p className="text-sm opacity-80" style={{ color: currentTheme.text }}>
                  {t("auth.reactivatedDesc", "Your account has been fully restored. You can now log in normally.")}
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-lg font-semibold shadow-md transition-all hover:opacity-90"
                style={{
                  backgroundColor: currentTheme.secondary,
                  color: theme === 'highContrast' ? '#000000' : (currentTheme.primaryText || '#ffffff')
                }}
              >
                {t("auth.goToLogin", "Go to Login")}
              </button>
            </div>
          ) : result === 'deleted' ? (
            /* 2. Deleted State */
            <div className="text-center space-y-6">
              <div className="text-6xl">💀</div>
              <div>
                <h4 className="text-xl font-bold mb-2 text-red-600">
                  {t("auth.deletedTitle", "Account Permanently Deleted")}
                </h4>
                <p className="text-sm opacity-80" style={{ color: currentTheme.text }}>
                  {t("auth.deletedDesc", "The 30-day grace period has expired. This account cannot be recovered.")}
                </p>
              </div>
              <Link
                to="/signup"
                className="block w-full py-3 rounded-lg font-semibold border hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                style={{
                    borderColor: currentTheme.border,
                    color: currentTheme.text
                }}
              >
                {t("auth.createNewAccount", "Create New Account")}
              </Link>
            </div>
          ) : (
            /* 3. Input Form State */
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              <p className="text-sm text-center opacity-80" style={{ color: currentTheme.text }}>
                {t("auth.recoverInstructions", "Enter the recovery token you saved when you requested deletion to stop the process and reactivate your account.")}
              </p>

              <div>
                <label
                  htmlFor="recovery-token"
                  className="block text-sm font-medium mb-2"
                  style={{ color: currentTheme.text }}
                >
                  {t("auth.recoveryToken", "Recovery Token")}
                </label>
                <input
                  id="recovery-token"
                  type="text"
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                    borderColor: currentTheme.border,
                  }}
                  placeholder={t("auth.tokenPlaceholder", "Paste token here...")}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  disabled={loading}
                />
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
                {loading ? t("common.verifying", "Verifying...") : t("auth.recoverBtn", "Recover Account")}
              </button>

              <div className="text-center mt-6">
                <Link
                  to="/login"
                  className="text-sm font-semibold hover:underline"
                  style={{ color: currentTheme.secondary }}
                >
                  {t("auth.cancelReturn", "Cancel and return to Login")}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </LandingNavbar>
  );
}