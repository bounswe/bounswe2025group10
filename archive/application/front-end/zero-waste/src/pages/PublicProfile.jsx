import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Spinner from "react-bootstrap/Spinner";
import { motion } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL;
const DEFAULT_PROFILE_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541";
const DEFAULT_POST_IMAGE = "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png";


export default function PublicProfile() {
  const { username } = useParams();
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);

  const fetchPublicProfile = async () => {
    try {
      const bioRes = await fetch(`${API_BASE}/api/profile/${username}/bio/`);
      const bioData = await bioRes.json();
      setBio(bioData.bio || "");
      try {
        const picRes = await fetch(`${API_BASE}/api/profile/${username}/picture/`);
        if (!picRes.ok) throw new Error("Image fetch failed");
        const blob = await picRes.blob();
        setAvatarUrl(URL.createObjectURL(blob));
      }
      catch (err) {
        console.error("Failed to load profile picture:", err);
        setAvatarUrl(DEFAULT_PROFILE_IMAGE);
      }
    } catch (err) {
      console.error("Failed to load public profile:", err);
      setBio("This user does not have a public bio.");
      setAvatarUrl(DEFAULT_PROFILE_IMAGE);
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    const token = localStorage.getItem("accessToken");

    const achRes = await fetch(`${API_BASE}/api/achievements/${username}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (achRes.ok) {
      const achData = await achRes.json();
      setAchievements(achData.data.achievements || []);
    }
  }

  useEffect(() => {
    fetchPublicProfile();
    fetchAchievements();
  }, [username]);

  return (
    <div className="main-bg min-vh-100 d-flex flex-column">
      <Navbar />
      <motion.main
        className="container mx-auto px-4 py-8 flex-grow-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {loading ? (
          <div className="d-flex justify-content-center pt-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <div className="max-w-xl mx-auto text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-sm p-6">
            <img
              src={avatarUrl}
              onError={(e) => (e.target.src = DEFAULT_PROFILE_IMAGE)}
              alt="Profile"
              className="mx-auto mb-4 h-32 w-32 rounded-full object-cover border"
            />
            <h1 className="text-2xl font-semibold">{username}</h1>
            <p className="mt-3 text-zinc-600 dark:text-zinc-300">{bio}</p>
          </div>
        )}
        {achievements.length > 0 && (
          <div className="mt-6 text-left">
            <h2 className="text-lg font-semibold mb-3">Achievements</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {achievements.map(({ id, achievement, earned_at }) => (
                <div
                  key={id}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-sm"
                >
                  {achievement.icon && (
                    <img
                      src={achievement.icon || DEFAULT_POST_IMAGE}
                      onError={(e) => (e.target.src = DEFAULT_POST_IMAGE)}
                      alt={achievement.title}
                      className="h-24 w-full object-cover rounded mb-2"
                    />
                  )}
                  <h3 className="text-md font-semibold">{achievement.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{achievement.description}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Earned: {new Date(earned_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.main>
    </div>
  );
}
