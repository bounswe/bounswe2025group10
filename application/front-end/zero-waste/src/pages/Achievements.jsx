// src/pages/Achievements.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApi } from "../hooks/useApi";
import { achievementsService } from "../services/achievementsService";
import { badgesService } from "../services/badgesService";
import { useAuth } from "../providers/AuthContext";
import { useTheme } from "../providers/ThemeContext";
import { useLanguage } from "../providers/LanguageContext";

export default function Achievements() {
  const { token } = useAuth();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("achievements"); // 'achievements' or 'badges'

  const {
    data: achievements,
    loading: isLoadingAchievements,
    error: achievementsError,
    execute: fetchAchievements,
  } = useApi(() => achievementsService.getAchievements(token), {
    initialData: [],
    showErrorToast: true,
    errorMessage: "Failed to fetch achievements",
  });

  const {
    data: badgesSummary,
    loading: isLoadingBadges,
    error: badgesError,
    execute: fetchBadges,
  } = useApi(() => badgesService.getUserBadgeSummary(token), {
    initialData: { total_badges: 0, badges_by_category: {}, progress: {} },
    showErrorToast: true,
    errorMessage: "Failed to fetch badges",
  });

  useEffect(() => {
    if (token) {
      fetchAchievements();
      fetchBadges();
    }
  }, [token]);

  const categoryDisplayNames = {
    PLASTIC: t("badge.plastic", "Plastic Recycler"),
    PAPER: t("badge.paper", "Paper Recycler"),
    GLASS: t("badge.glass", "Glass Recycler"),
    METAL: t("badge.metal", "Metal Recycler"),
    ELECTRONIC: t("badge.electronic", "E-Waste Recycler"),
    OIL_AND_FATS: t("badge.oil", "Oil & Fats Recycler"),
    ORGANIC: t("badge.organic", "Organic Recycler"),
    TOTAL_WASTE: t("badge.total", "Waste Warrior"),
    CONTRIBUTIONS: t("badge.contributions", "Contributor"),
    LIKES_RECEIVED: t("badge.likes", "Popular"),
  };

  const levelDisplayNames = {
    1: t("badge.bronze", "Bronze"),
    2: t("badge.silver", "Silver"),
    3: t("badge.gold", "Gold"),
    4: t("badge.platinum", "Platinum"),
    5: t("badge.diamond", "Diamond"),
  };

  const getBadgeEmoji = (category) => {
    const emojiMap = {
      PLASTIC: "♻️",
      PAPER: "📄",
      GLASS: "🥃",
      METAL: "🔩",
      ELECTRONIC: "💻",
      OIL_AND_FATS: "🛢️",
      ORGANIC: "🌱",
      TOTAL_WASTE: "🏆",
      CONTRIBUTIONS: "✍️",
      LIKES_RECEIVED: "❤️",
    };
    return emojiMap[category] || "🏅";
  };

  const getLevelColor = (level) => {
    const colors = {
      1: "#CD7F32", // Bronze
      2: "#C0C0C0", // Silver
      3: "#FFD700", // Gold
      4: "#E5E4E2", // Platinum
      5: "#B9F2FF", // Diamond
    };
    return colors[level] || "#808080";
  };

  const isLoading = isLoadingAchievements || isLoadingBadges;
  const error = achievementsError || badgesError;

  return (
    <motion.main
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="mb-8">
        <h1
          className="text-3xl font-bold tracking-tight mb-4"
          style={{ color: currentTheme.text }}
        >
          {t("achievements.title", "Achievements & Badges")}
        </h1>

        {/* Tabs */}
        <div
          className="flex gap-2 border-b"
          style={{ borderColor: currentTheme.border }}
        >
          <button
            onClick={() => setActiveTab("achievements")}
            className="px-6 py-3 font-medium transition-colors rounded-t-lg"
            style={{
              color:
                activeTab === "achievements" ? "#FFFFFF" : currentTheme.text,
              backgroundColor:
                activeTab === "achievements"
                  ? currentTheme.primary
                  : "transparent",
              borderBottom:
                activeTab === "achievements"
                  ? `2px solid ${currentTheme.primary}`
                  : "none",
              opacity: activeTab === "achievements" ? 1 : 0.7,
            }}
          >
            {t("challenge.title", "Challenges")} ({achievements.length})
          </button>
          <button
            onClick={() => setActiveTab("badges")}
            className="px-6 py-3 font-medium transition-colors rounded-t-lg"
            style={{
              color: activeTab === "badges" ? "#FFFFFF" : currentTheme.text,
              backgroundColor:
                activeTab === "badges" ? currentTheme.primary : "transparent",
              borderBottom:
                activeTab === "badges"
                  ? `2px solid ${currentTheme.primary}`
                  : "none",
              opacity: activeTab === "badges" ? 1 : 0.7,
            }}
          >
            {t("badge.title", "Badges")} ({badgesSummary.total_badges})
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div
            className="text-lg opacity-70"
            style={{ color: currentTheme.text }}
          >
            {t("achievements.loading", "Loading...")}
          </div>
        </div>
      ) : error ? (
        <p style={{ color: currentTheme.primary }}>
          {t("achievements.error", "Failed to load data.")}
        </p>
      ) : (
        <>
          {/* Achievements Tab */}
          {activeTab === "achievements" && (
            <>
              {achievements.length === 0 ? (
                <p style={{ color: currentTheme.text, opacity: 0.7 }}>
                  {t(
                    "achievements.noAchievements",
                    "No achievements earned yet."
                  )}
                </p>
              ) : (
                <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {achievements.map(({ id, achievement, earned_at }) => (
                    <motion.div
                      key={id}
                      className="flex flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md"
                      style={{
                        backgroundColor: currentTheme.background,
                        borderColor: currentTheme.border,
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay:
                          achievements.indexOf({ id, achievement, earned_at }) *
                          0.05,
                      }}
                    >
                      {achievement.icon && (
                        <img
                          src={achievement.icon}
                          alt={achievement.title}
                          className="h-32 w-full object-cover"
                        />
                      )}
                      <div className="p-4 flex-1">
                        <h3
                          className="text-lg font-semibold"
                          style={{ color: currentTheme.text }}
                        >
                          {achievement.title}
                        </h3>
                        <p
                          className="mt-1 text-sm"
                          style={{ color: currentTheme.text, opacity: 0.85 }}
                        >
                          {achievement.description}
                        </p>
                        <p
                          className="mt-2 text-xs"
                          style={{ color: currentTheme.text, opacity: 0.6 }}
                        >
                          {t("achievements.earnedAt", "Earned at")}:{" "}
                          {new Date(earned_at).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </section>
              )}
            </>
          )}

          {/* Badges Tab */}
          {activeTab === "badges" && (
            <>
              {badgesSummary.total_badges === 0 ? (
                <p style={{ color: currentTheme.text, opacity: 0.7 }}>
                  {t(
                    "badge.noBadges",
                    "No badges earned yet. Keep recycling to earn badges!"
                  )}
                </p>
              ) : (
                <div className="space-y-8">
                  {Object.entries(badgesSummary.badges_by_category).map(
                    ([category, badges]) => (
                      <div key={category}>
                        <h2
                          className="text-2xl font-bold mb-4 flex items-center gap-2"
                          style={{ color: currentTheme.text }}
                        >
                          <span className="text-3xl">
                            {getBadgeEmoji(category)}
                          </span>
                          {categoryDisplayNames[category] || category}
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          {badges.map((badge) => (
                            <motion.div
                              key={badge.id}
                              className="flex flex-col items-center p-6 rounded-xl border shadow-sm transition hover:shadow-md"
                              style={{
                                backgroundColor: currentTheme.background,
                                borderColor: getLevelColor(badge.level),
                                borderWidth: "2px",
                              }}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.05 }}
                            >
                              <div
                                className="text-6xl mb-3"
                                style={{
                                  filter: `drop-shadow(0 0 8px ${getLevelColor(
                                    badge.level
                                  )})`,
                                }}
                              >
                                {getBadgeEmoji(badge.category)}
                              </div>
                              <h3
                                className="text-lg font-bold text-center"
                                style={{ color: getLevelColor(badge.level) }}
                              >
                                {levelDisplayNames[badge.level] ||
                                  `Level ${badge.level}`}
                              </h3>
                              <p
                                className="text-sm text-center mt-2"
                                style={{
                                  color: currentTheme.text,
                                  opacity: 0.8,
                                }}
                              >
                                {badge.criteria_value.toLocaleString()}g
                              </p>
                              <p
                                className="text-xs text-center mt-2"
                                style={{
                                  color: currentTheme.text,
                                  opacity: 0.6,
                                }}
                              >
                                {t("badge.earnedAt", "Earned")}:{" "}
                                {new Date(badge.earned_at).toLocaleDateString()}
                              </p>
                            </motion.div>
                          ))}
                        </div>

                        {/* Progress for this category */}
                        {badgesSummary.progress[category] &&
                          !badgesSummary.progress[category].all_earned && (
                            <div
                              className="mt-4 p-4 rounded-lg"
                              style={{
                                backgroundColor: currentTheme.hover,
                                borderLeft: `4px solid ${currentTheme.primary}`,
                              }}
                            >
                              <p
                                className="text-sm font-medium mb-2"
                                style={{ color: currentTheme.text }}
                              >
                                {t("badge.nextBadge", "Progress to next badge")}
                                :
                              </p>
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div
                                    className="h-3 rounded-full overflow-hidden"
                                    style={{
                                      backgroundColor: currentTheme.border,
                                    }}
                                  >
                                    <div
                                      className="h-full transition-all duration-500"
                                      style={{
                                        width: `${Math.min(
                                          badgesSummary.progress[category]
                                            .percentage,
                                          100
                                        )}%`,
                                        backgroundColor: currentTheme.primary,
                                      }}
                                    />
                                  </div>
                                </div>
                                <span
                                  className="text-sm font-medium"
                                  style={{ color: currentTheme.text }}
                                >
                                  {badgesSummary.progress[
                                    category
                                  ].percentage.toFixed(1)}
                                  %
                                </span>
                              </div>
                              <p
                                className="text-xs mt-2"
                                style={{
                                  color: currentTheme.text,
                                  opacity: 0.7,
                                }}
                              >
                                {badgesSummary.progress[
                                  category
                                ].current_value.toLocaleString()}
                                g /{" "}
                                {badgesSummary.progress[
                                  category
                                ].required_value.toLocaleString()}
                                g
                              </p>
                            </div>
                          )}
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </motion.main>
  );
}
