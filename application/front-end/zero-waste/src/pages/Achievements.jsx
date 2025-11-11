// src/pages/Achievements.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import { showToast } from "../utils/toast";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAchievements = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/api/achievements/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.data?.achievements || [];
      setAchievements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      showToast("Error fetching achievements: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  return (
    <div className="main-bg min-vh-100 d-flex flex-column">
      <Navbar active="Achievements" />
      <motion.main
        className="container mx-auto px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        </header>

        {isLoading ? (
          <p className="text-zinc-500">Loading achievements...</p>
        ) : error ? (
          <p className="text-red-500">Failed to load achievements.</p>
        ) : achievements.length === 0 ? (
          <p className="text-zinc-500">No achievements earned yet.</p>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map(({ id, achievement, earned_at }) => (
              <div
                key={id}
                className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
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
                  <h3 className="text-lg font-semibold">{achievement.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {achievement.description}
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">
                    Earned at: {new Date(earned_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </section>
        )}
      </motion.main>
    </div>
  );
}
