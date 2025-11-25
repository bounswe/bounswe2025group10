// src/pages/profile/PublicProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";
import { useAuth } from "../../providers/AuthContext";
import { showToast } from "../../utils/toast";

const API_BASE = import.meta.env.VITE_API_URL;
const DEFAULT_PROFILE_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541";
const DEFAULT_POST_IMAGE = "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png";

export default function PublicProfile() {
  const { username } = useParams();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { token, username: currentUsername } = useAuth();
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [userId, setUserId] = useState(null);

  // Fetch bio and avatar
  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        const bioRes = await fetch(`${API_BASE}/api/profile/${username}/bio/`);
        const bioData = await bioRes.json();
        setBio(bioData.bio || "");

        // Store user ID for reporting
        if (bioData.user_id) {
          setUserId(bioData.user_id);
        }

        try {
          const picRes = await fetch(`${API_BASE}/api/profile/${username}/picture/`);
          if (!picRes.ok) throw new Error("Image fetch failed");
          const blob = await picRes.blob();
          setAvatarUrl(URL.createObjectURL(blob));
        } catch (err) {
          console.error("Failed to load profile picture:", err);
          setAvatarUrl(DEFAULT_PROFILE_IMAGE);
        }
      } catch (err) {
        console.error("Failed to load public profile:", err);
        setBio(t('profile.noBio', "This user does not have a public bio."));
        setAvatarUrl(DEFAULT_PROFILE_IMAGE);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [username, t]);

  // Fetch achievements
  useEffect(() => {
    const fetchAchievements = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const achRes = await fetch(`${API_BASE}/api/achievements/${username}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (achRes.ok) {
          const achData = await achRes.json();
          setAchievements(achData.data.achievements || []);
        }
      } catch (error) {
        console.error("Failed to fetch achievements:", error);
      }
    };

    fetchAchievements();
  }, [username]);

  // Report user function
  const handleReportUser = async () => {
    if (!token) {
      showToast(t("common.loginRequired", "Please login to report"), "error");
      return;
    }

    if (!reportReason.trim()) {
      showToast(t("common.reasonRequired", "Please provide a reason"), "error");
      return;
    }

    if (!userId) {
      showToast(t("common.error", "User ID not found"), "error");
      return;
    }

    setIsReporting(true);
    try {
      // Use the correct endpoint format: /api/<content_type>/<object_id>/report/
      // Note: content_type should be lowercase model name "users"
      const response = await fetch(`${API_BASE}/api/users/${userId}/report/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Report user error response:", data);
        throw new Error(data.detail || data.message || data.error || "Failed to report user");
      }

      showToast(t("common.reportSuccess", "User reported successfully"), "success");
      setShowReportModal(false);
      setReportReason("");
      setReportDescription("");
    } catch (error) {
      console.error("Failed to report user:", error);
      const errorMessage = error.message || t("common.error", "Failed to report user");
      showToast(errorMessage, "error");
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <Navbar>
      <motion.main
        className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2" style={{ borderColor: currentTheme.secondary }}></div>
            <span className="ms-3 opacity-70" style={{ color: currentTheme.text }}>{t("common.loading", "Loading...")}</span>
          </div>
        ) : (
          <div
            className="max-w-xl mx-auto text-center border rounded-2xl shadow-sm p-8 relative"
            style={{
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.border
            }}
          >
            {/* Report button - only show if viewing someone else's profile and user is logged in */}
            {token && currentUsername !== username && (
              <button
                onClick={() => setShowReportModal(true)}
                className="absolute top-4 right-4 rounded-lg p-2 backdrop-blur-sm transition-opacity hover:opacity-100 opacity-60"
                style={{
                  backgroundColor: currentTheme.background + 'E6',
                  border: `1px solid ${currentTheme.border}`,
                }}
                title={t('common.report', 'Report this user')}
              >
                <span className="text-sm">⚠️</span>
              </button>
            )}

            <div className="relative inline-block mb-6">
              <img
                src={avatarUrl}
                onError={(e) => (e.target.src = DEFAULT_PROFILE_IMAGE)}
                alt={t("profile.profileImageAlt", "Profile Picture")}
                className="h-32 w-32 rounded-full object-cover border-4 shadow-sm"
                style={{ borderColor: currentTheme.background }}
              />
              <div className="absolute inset-0 rounded-full border-2 opacity-10" style={{ borderColor: currentTheme.text }}></div>
            </div>

            <h1 className="text-3xl font-bold mb-3" style={{ color: currentTheme.text }}>{username}</h1>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t" style={{ borderColor: currentTheme.border }}></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-sm font-medium" style={{ backgroundColor: currentTheme.background, color: currentTheme.secondary }}>
                  {t('profile.bio', 'Bio')}
                </span>
              </div>
            </div>

            <p className="text-lg leading-relaxed" style={{ color: currentTheme.text, opacity: 0.8 }}>
              {bio}
            </p>
          </div>
        )}

        {achievements.length > 0 && (
          <div className="mt-12 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: currentTheme.text }}>
              <span>🏆</span> {t("profile.achievements", "Achievements")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map(({ id, achievement, earned_at }) => (
                <div
                  key={id}
                  className="rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow"
                  style={{
                    backgroundColor: currentTheme.background,
                    borderColor: currentTheme.border
                  }}
                >
                  {achievement.icon && (
                    <div className="mb-3 overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={achievement.icon || DEFAULT_POST_IMAGE}
                        onError={(e) => (e.target.src = DEFAULT_POST_IMAGE)}
                        alt={achievement.title}
                        className="h-32 w-full object-cover"
                      />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold mb-1" style={{ color: currentTheme.text }}>{achievement.title}</h3>
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: currentTheme.text, opacity: 0.7 }}>
                    {achievement.description}
                  </p>
                  <div className="pt-3 border-t flex justify-between items-center text-xs" style={{ borderColor: currentTheme.border, color: currentTheme.text, opacity: 0.6 }}>
                    <span>{t("profile.earned", "Earned")}</span>
                    <span>{new Date(earned_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report User Modal */}
        <AnimatePresence>
          {showReportModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReportModal(false)}
            >
              <motion.div
                className="w-full max-w-md rounded-2xl border shadow-xl p-6"
                style={{
                  backgroundColor: currentTheme.background,
                  borderColor: currentTheme.border
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-bold mb-4" style={{ color: currentTheme.text }}>
                  {t("common.reportUser", "Report User")}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium opacity-70 block mb-2" style={{ color: currentTheme.text }}>
                      {t("common.reason", "Reason")} *
                    </label>
                    <input
                      type="text"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full rounded-lg border p-3 bg-transparent focus:ring-2 outline-none"
                      style={{
                        borderColor: currentTheme.border,
                        color: currentTheme.text
                      }}
                      placeholder={t("common.enterReason", "Enter reason...")}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium opacity-70 block mb-2" style={{ color: currentTheme.text }}>
                      {t("common.description", "Description")}
                    </label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border p-3 bg-transparent focus:ring-2 outline-none resize-none"
                      style={{
                        borderColor: currentTheme.border,
                        color: currentTheme.text
                      }}
                      placeholder={t("common.enterDescription", "Enter description...")}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowReportModal(false);
                        setReportReason("");
                        setReportDescription("");
                      }}
                      className="flex-1 px-4 py-2 rounded-lg border hover:opacity-70 transition-opacity"
                      style={{
                        borderColor: currentTheme.border,
                        color: currentTheme.text
                      }}
                    >
                      {t("common.cancel", "Cancel")}
                    </button>
                    <button
                      onClick={handleReportUser}
                      disabled={isReporting || !reportReason.trim()}
                      className="flex-1 px-4 py-2 rounded-lg text-white font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none"
                      style={{ backgroundColor: "#dc2626" }}
                    >
                      {isReporting ? t("common.reporting", "Reporting...") : t("common.report", "Report")}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
    </Navbar>
  );
}
