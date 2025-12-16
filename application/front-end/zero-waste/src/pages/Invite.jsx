// src/pages/Invite.jsx
import React, { useState } from "react";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../providers/AuthContext";
import { useLanguage } from "../providers/LanguageContext";
import { useTheme } from "../providers/ThemeContext";
import { showToast } from "../utils/toast";
import { inviteService } from "../services/inviteService";

export default function Invite() {
  const { token } = useAuth();
  const { t, isRTL } = useLanguage();
  const { currentTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      showToast(t("invite.errors.noEmail"), "error");
      return;
    }

    setLoading(true);
    try {
      const data = await inviteService.sendInvite(email, token);
      showToast(data.message, "success");
      setEmail("");
    } catch (err) {
      const msg = err.response?.data?.error || t("invite.errors.failed");
      showToast(msg, "error");
    }
    setLoading(false);
  };

  return (
    <div
      className="max-w-lg mx-auto p-6 mt-6 rounded-xl shadow-lg"
      style={{
        backgroundColor: currentTheme.background,
        color: currentTheme.text,
        border: `1px solid ${currentTheme.border}`,
        direction: isRTL ? "rtl" : "ltr",
      }}
    >
      <h1 className="text-2xl font-bold mb-4">
        {t("invite.title")}
      </h1>

      <p className="mb-4 opacity-80">
        {t("invite.subtitle")}
      </p>

      <label className="text-sm mb-1 block">{t("invite.emailLabel")}</label>

      <input
        type="email"
        placeholder="friend@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border mb-4"
        style={{
          backgroundColor: currentTheme.background,
          color: currentTheme.text,
          borderColor: currentTheme.border,
        }}
      />

      <button
        onClick={handleInvite}
        disabled={loading}
        className="w-full px-4 py-2 rounded-lg font-semibold transition-all"
        style={{
          backgroundColor: currentTheme.secondary,
          color: currentTheme.background,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? t("invite.sending") : t("invite.send")}
      </button>
    </div>
  );
}
