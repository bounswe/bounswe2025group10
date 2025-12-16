// src/pages/profile/PublicProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";
import { useAuth } from "../../providers/AuthContext";
import { showToast } from "../../utils/toast";
import { profileService } from "../../services/profileService";

const API_BASE = import.meta.env.VITE_API_URL;
const DEFAULT_PROFILE_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541";
const DEFAULT_POST_IMAGE = "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png";

export default function PublicProfile() {
  const { username } = useParams();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { token, username: currentUsername } = useAuth();

  // --- State ---
  const [loading, setLoading] = useState(true);
  
  // Profile Data
  const [bio, setBio] = useState("");
  const [isBioPrivate, setIsBioPrivate] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [userId, setUserId] = useState(null);

  // Stats Data
  const [wasteStats, setWasteStats] = useState({ points: 0, total_waste: 0 });
  const [isStatsPrivate, setIsStatsPrivate] = useState(false);

  // Achievements
  const [achievements, setAchievements] = useState([]);

  // Follow Data
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [followLoading, setFollowLoading] = useState(false);

  // Reporting
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  // --- Effects ---

  // 1. Fetch Main Profile Data (Bio, Stats, Picture, Follow Status)
  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);

        // A. Fetch Bio & User ID
        try {
          // Using profileService as requested
          const bioData = await profileService.getUserBio(username);
          
          if (bioData.user_id) setUserId(bioData.user_id);

          // Handle Bio Privacy: API returns null if private
          if (bioData.bio === null) {
            setIsBioPrivate(true);
            setBio("");
          } else {
            setIsBioPrivate(false);
            setBio(bioData.bio || "");
                  }
        } catch (err) {
          console.error("Failed to load bio:", err);
          setBio("");
        }

        // B. Fetch Waste Stats (New)
        try {
          // Pass token to check for 'followers' privacy permission
          const statsData = await profileService.getUserWasteStats(username, token);
          
          // If endpoints return nulls, it means private/hidden
          if (statsData && statsData.points !== null && statsData.total_waste !== null) {
            setWasteStats({
              points: statsData.points,
              total_waste: statsData.total_waste
            });
            setIsStatsPrivate(false);
          } else {
            setIsStatsPrivate(true);
          }
        } catch (err) {
          console.error("Failed to load stats:", err);
          setIsStatsPrivate(true);
        }

        // C. Fetch Profile Picture
        try {
          const picRes = await fetch(`${API_BASE}/api/profile/${username}/picture/`);
          if (picRes.ok) {
            const blob = await picRes.blob();
            setAvatarUrl(URL.createObjectURL(blob));
          } else {
             // Handle redirect or error
             if(picRes.url && picRes.url.startsWith('http')) {
                setAvatarUrl(picRes.url);
             } else {
                setAvatarUrl(DEFAULT_PROFILE_IMAGE);
             }
          }
        } catch (err) {
          setAvatarUrl(DEFAULT_PROFILE_IMAGE);
        }

        // D. Fetch Follow Status
        if (token) {
          try {
            const statusData = await profileService.getFollowStatus(username, token);
            if (statusData && statusData.data) {
              setIsFollowing(statusData.data.is_following);
              setFollowStats({
                followers: statusData.data.followers_count,
                following: statusData.data.following_count
              });
            }
          } catch (err) {
            console.error("Failed to fetch follow status", err);
          }
        }

      } catch (err) {
        console.error("Failed to load public profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [username, token]);

  // 2. Fetch Achievements
  useEffect(() => {
    const fetchAchievements = async () => {
      const authToken = localStorage.getItem("accessToken");
      if (!authToken) return;

      try {
        const achRes = await fetch(`${API_BASE}/api/achievements/${username}/`, {
          headers: { Authorization: `Bearer ${authToken}` },
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

  // --- Handlers ---

  const handleFollowToggle = async () => {
    if (!token) {
      showToast(t("common.loginRequired", "Please login to follow"), "error");
      return;
    }
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await profileService.unfollowUser(username, token);
        setIsFollowing(false);
        setFollowStats(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
        showToast(t("profile.unfollowed", "Unfollowed successfully"), "success");
      } else {
        await profileService.followUser(username, token);
        setIsFollowing(true);
        setFollowStats(prev => ({ ...prev, followers: prev.followers + 1 }));
        showToast(t("profile.followed", "Followed successfully"), "success");
      }
      
      // Re-fetch stats after following, as privacy settings (Followers Only) might now allow viewing
      const updatedStats = await profileService.getUserWasteStats(username, token);
      if (updatedStats && updatedStats.points !== null) {
          setWasteStats({
              points: updatedStats.points,
              total_waste: updatedStats.total_waste
          });
          setIsStatsPrivate(false);
      }

    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setFollowLoading(false);
    }
  };

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
        throw new Error(data.detail || data.message || "Failed to report user");
      }

      showToast(t("common.reportSuccess", "User reported successfully"), "success");
      setShowReportModal(false);
      setReportReason("");
      setReportDescription("");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsReporting(false);
    }
  };

  return (
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
          {/* Report button */}
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

          {/* Avatar */}
            <div className="relative inline-block mb-6">
              <img
                src={avatarUrl || DEFAULT_PROFILE_IMAGE}
                onError={(e) => (e.target.src = DEFAULT_PROFILE_IMAGE)}
                alt={t("profile.profileImageAlt", "Profile Picture")}
                className="h-32 w-32 rounded-full object-cover border-4 shadow-sm"
                style={{ borderColor: currentTheme.background }}
              />
              <div className="absolute inset-0 rounded-full border-2 opacity-10" style={{ borderColor: currentTheme.text }}></div>
            </div>

            <h1 className="text-3xl font-bold mb-3" style={{ color: currentTheme.text }}>{username}</h1>

            {/* Follow Stats */}
            <div className="flex justify-center gap-6 mb-4 text-sm opacity-80" style={{ color: currentTheme.text }}>
                <div>
                    <span className="font-bold">{followStats.followers}</span> {t('profile.followers', 'Followers')}
                </div>
                <div>
                    <span className="font-bold">{followStats.following}</span> {t('profile.following', 'Following')}
                </div>
            </div>

            {/* Follow Button */}
            {token && currentUsername !== username && (
                <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all mb-6 ${
                        isFollowing 
                        ? "border bg-transparent" 
                        : "text-white shadow-md hover:shadow-lg"
                    }`}
                    style={{ 
                        backgroundColor: isFollowing ? 'transparent' : currentTheme.secondary,
                        borderColor: isFollowing ? currentTheme.border : 'transparent',
                        color: isFollowing ? currentTheme.text : 'white',
                        opacity: followLoading ? 0.7 : 1
                    }}
                >
                    {followLoading 
                        ? t('common.loading', 'Loading...') 
                        : isFollowing 
                            ? t('profile.unfollow', 'Unfollow') 
                            : t('profile.follow', 'Follow')
                    }
                </button>
            )}

          {/* -------------------- Environmental Impact Section (NEW) -------------------- */}
          <div className="mb-8 p-4 rounded-xl border border-dashed" style={{ borderColor: currentTheme.border }}>
             <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-70" style={{ color: currentTheme.text }}>
                 {t('profile.impactStats', 'Environmental Impact')}
             </h3>
             
             {isStatsPrivate ? (
                 <div className="flex flex-col items-center justify-center py-4 opacity-60">
                     <span className="text-3xl mb-2">🔒</span>
                     <p className="text-sm italic">{t('profile.statsPrivate', 'Statistics are hidden by privacy settings.')}</p>
                 </div>
             ) : (
                 <div className="grid grid-cols-2 gap-4">
                     <div className="p-3 rounded-lg" style={{ backgroundColor: currentTheme.surface || currentTheme.background }}>
                         <div className="text-2xl font-bold" style={{ color: currentTheme.secondary }}>
                             {wasteStats.total_waste ? parseFloat(wasteStats.total_waste).toFixed(2) : 0} g
                         </div>
                         <div className="text-xs opacity-70" style={{ color: currentTheme.text }}>
                             {t('profile.totalWaste', 'CO2 Reduced')}
                         </div>
                     </div>
                     <div className="p-3 rounded-lg" style={{ backgroundColor: currentTheme.surface || currentTheme.background }}>
                         <div className="text-2xl font-bold text-yellow-500">
                             {wasteStats.points || 0}
                         </div>
                         <div className="text-xs opacity-70" style={{ color: currentTheme.text }}>
                             {t('profile.points', 'Points')}
                         </div>
                     </div>
                 </div>
             )}
          </div>
          {/* ------------------------------------------------------------------------- */}

          {/* Bio Section */}
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

            {/* Bio Content with Privacy Check */}
          {isBioPrivate ? (
             <div className="flex flex-col items-center py-4 opacity-60">
                 <span className="text-xl mb-2">🔒</span>
                 <p className="italic text-sm" style={{ color: currentTheme.text }}>
                     {t('profile.bioPrivate', 'This user\'s bio is private.')}
                 </p>
             </div>
          ) : (
            <p className="text-lg leading-relaxed" style={{ color: currentTheme.text, opacity: 0.8 }}>
                {bio || t('profile.noBio', 'This user does not have a public bio.')}
              </p>
            )}

        </div>
        )}

      {/* Achievements Section */}
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