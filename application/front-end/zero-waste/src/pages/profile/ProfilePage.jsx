// src/pages/profile/ProfilePage.jsx
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../providers/AuthContext";
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";
import { showToast } from "../../utils/toast";
import { profileService } from "../../services/profileService";
import { postsService } from "../../services/postsService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const DEFAULT_PROFILE_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541";
const DEFAULT_POST_IMAGE = "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png";
const API_BASE = import.meta.env.VITE_API_URL;

export default function ProfilePage() {
  const { token, username, logout } = useAuth();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  // State
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [bioDraft, setBioDraft] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_PROFILE_IMAGE);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch profile and posts on mount
  useEffect(() => {
    if (token && username) {
      loadProfile();
      loadPosts();
    }
  }, [token, username]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile(username, token);
      setProfile(data);
      setBioDraft(data.bio || "");

      // Try to load avatar
      try {
        const res = await fetch(`${API_BASE}/api/profile/${username}/picture/`);
        if (res.ok) {
          const blob = await res.blob();
          setAvatarUrl(URL.createObjectURL(blob));
        } else {
          setAvatarUrl(DEFAULT_PROFILE_IMAGE);
        }
      } catch {
        setAvatarUrl(DEFAULT_PROFILE_IMAGE);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      showToast(t('common.error', 'Failed to load profile'), "error");
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      setPostsLoading(true);
      const result = await postsService.getUserPosts(token);
      // Handle both {data: [...]} and [...] formats
      const postsArray = result.data || result;
      setPosts(Array.isArray(postsArray) ? postsArray : []);
    } catch (error) {
      console.error("Failed to load posts:", error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      await profileService.updateProfile(username, bioDraft, avatarFile, token);
      showToast(t('common.saved', 'Saved successfully'), "success");

      // Reload profile
      await loadProfile();
      setAvatarFile(null);
    } catch (error) {
      console.error(error);
      showToast(t('common.error', 'Failed to save'), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: currentTheme.background }}>
        <div className="h-12 w-12 animate-spin rounded-full border-b-2" style={{ borderColor: currentTheme.secondary }}></div>
      </div>
    );
  }

  return (
    <Navbar active="profile">
      <motion.main
        className="max-w-5xl mx-auto px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Profile Card */}
        <div
          className="rounded-2xl border p-8 mb-8 shadow-sm"
          style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border }}
        >
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Avatar */}
            <div className="relative group">
              <div
                className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-offset-2 cursor-pointer transition-transform hover:scale-105"
                style={{ ringColor: currentTheme.secondary }}
                onClick={() => fileInputRef.current?.click()}
              >
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-full h-full object-cover"
                  onError={(e) => e.target.src = DEFAULT_PROFILE_IMAGE}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold uppercase tracking-wider">Change</span>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* Info & Edit */}
            <div className="flex-1 w-full space-y-4">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold" style={{ color: currentTheme.text }}>{username}</h1>
                <button
                  onClick={logout}
                  className="text-sm px-4 py-2 rounded-lg border hover:opacity-70 transition-opacity"
                  style={{ borderColor: currentTheme.border, color: currentTheme.text }}
                >
                  {t('common.logout', 'Log out')}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium opacity-70" style={{ color: currentTheme.text }}>
                  {t('profile.bio', 'Bio')}
                </label>
                <textarea
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border p-3 bg-transparent focus:ring-2 outline-none transition-all"
                  style={{
                    borderColor: currentTheme.border,
                    color: currentTheme.text
                  }}
                  placeholder={t('profile.bioPlaceholder', 'Tell us about yourself...')}
                />
              </div>

              <div className="flex justify-end gap-3">
                {avatarFile && (
                  <button
                    onClick={() => {
                      setAvatarFile(null);
                      loadProfile();
                    }}
                    className="px-4 py-2 text-sm font-medium opacity-70 hover:opacity-100"
                    style={{ color: currentTheme.text }}
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving || (!avatarFile && bioDraft === profile?.bio)}
                  className="px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none"
                  style={{ backgroundColor: currentTheme.secondary }}
                >
                  {isSaving ? t('common.saving', 'Saving...') : t('common.save', 'Save Changes')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
            {t('profile.yourPosts', 'Your Posts')}
          </h2>

          {postsLoading ? (
            <div className="text-center py-12 opacity-50" style={{ color: currentTheme.text }}>
              {t('common.loading', 'Loading...')}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map(post => (
                <PostCard key={post.id} post={post} currentTheme={currentTheme} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl border border-dashed" style={{ borderColor: currentTheme.border }}>
              <p className="opacity-60" style={{ color: currentTheme.text }}>
                {t('profile.noPosts', 'No posts yet')}
              </p>
            </div>
          )}
        </div>
      </motion.main>
    </Navbar>
  );
}

// Simple Post Card Component
function PostCard({ post, currentTheme }) {
  return (
    <div
      className="rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all group"
      style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border }}
    >
      {post.image_url && (
        <div className="h-48 overflow-hidden">
          <img
            src={post.image_url}
            alt="Post"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => e.target.src = DEFAULT_POST_IMAGE}
          />
        </div>
      )}
      <div className="p-4 space-y-3">
        <p className="text-sm line-clamp-3" style={{ color: currentTheme.text }}>{post.text}</p>
        <div className="flex items-center justify-between text-xs opacity-60" style={{ color: currentTheme.text }}>
          <span>{dayjs(post.date).fromNow()}</span>
          <div className="flex gap-3">
            <span>👍 {post.like_count}</span>
            <span>👎 {post.dislike_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
