// src/pages/Achievements.jsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useApi } from "../hooks/useApi";
import { achievementsService } from "../services/achievementsService";
import { useAuth } from "../providers/AuthContext";
import { useTheme } from "../providers/ThemeContext";
import { useLanguage } from "../providers/LanguageContext";

export default function Achievements() {
  const { token } = useAuth();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  const {
    data: achievements,
    loading: isLoading,
    error,
    execute: fetchAchievements,
  } = useApi(
    () => achievementsService.getAchievements(token),
    {
      initialData: [],
      showErrorToast: true,
      errorMessage: 'Failed to fetch achievements',
    }
  );

  useEffect(() => {
    if (token) {
      fetchAchievements();
    }
  }, [token]);

  return (
    <motion.main
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: currentTheme.text }}>
          {t('achievements.title', 'Achievements')}
        </h1>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-lg opacity-70" style={{ color: currentTheme.text }}>
            {t('achievements.loading', 'Loading achievements...')}
          </div>
        </div>
      ) : error ? (
        <p style={{ color: currentTheme.primary }}>{t('achievements.error', 'Failed to load achievements.')}</p>
      ) : achievements.length === 0 ? (
        <p style={{ color: currentTheme.text, opacity: 0.7 }}>{t('achievements.noAchievements', 'No achievements earned yet.')}</p>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map(({ id, achievement, earned_at }) => (
            <motion.div
              key={id}
              className="flex flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md"
              style={{
                backgroundColor: currentTheme.background,
                borderColor: currentTheme.border
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: achievements.indexOf({ id, achievement, earned_at }) * 0.05 }}
            >
              {/* Icon at the top */}
              {achievement.icon && (
                <img
                  src={achievement.icon}
                  alt={achievement.title}
                  className="h-32 w-full object-cover"
                />
              )}

              {/* Content below */}
              <div className="p-4 flex-1">
                <h3 className="text-lg font-semibold" style={{ color: currentTheme.text }}>
                  {achievement.title}
                </h3>
                <p className="mt-1 text-sm" style={{ color: currentTheme.text, opacity: 0.85 }}>
                  {achievement.description}
                </p>
                <p className="mt-2 text-xs" style={{ color: currentTheme.text, opacity: 0.6 }}>
                  {t('achievements.earnedAt', 'Earned at')}: {new Date(earned_at).toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
        </section>
      )}
    </motion.main>
  );
}
