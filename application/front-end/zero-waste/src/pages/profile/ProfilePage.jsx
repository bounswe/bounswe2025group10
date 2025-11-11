// src/profile/ProfilePage.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import { Card, Button, Form, Image } from "react-bootstrap";
import { useAuth } from "../../providers/AuthContext";
import { showToast } from "../../utils/toast";
import dayjs from "dayjs";
import Spinner from "react-bootstrap/Spinner";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const DEFAULT_PROFILE_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541";
const DEFAULT_POST_IMAGE = "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png";
const API_BASE = import.meta.env.VITE_API_URL;

export default function ProfilePage() {
  const { token, username, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [bioDraft, setBioDraft] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postComments, setPostComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [viewingCommentsPostId, setViewingCommentsPostId] = useState(null);
  const [commentSortOrder, setCommentSortOrder] = useState("newest");

  const fileInputRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const resBio = await fetch(`${API_BASE}/api/profile/${username}/bio/`);
      if (!resBio.ok) throw new Error("bio");
      const { bio } = await resBio.json();

      const avatarUrl = `${API_BASE}/api/profile/${username}/picture/?t=${Date.now()}`;
      setProfile({ username, bio, avatar: avatarUrl });
      setAvatarError(false);
      setBioDraft(bio);
    } catch (err) {
      showToast("Could not load profile", "error");
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/user/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) setPosts(result.data);
      else throw new Error();
    } catch {
      showToast("Could not load posts", "error");
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const response = await fetch(`${API_BASE}/api/posts/${postId}/comments/`);
      const result = await response.json();
      if (response.ok) {
        setPostComments((prev) => ({ ...prev, [postId]: result.data }));
      } else {
        showToast(result.message || "Failed to fetch comments.", "error");
      }
    } catch (err) {
      showToast("Error fetching comments: " + err.message, "error");
    }
  };

  const handleCreateComment = async (postId) => {
    const content = commentInputs[postId];
    if (!content || !content.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/api/posts/${postId}/comments/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      const result = await response.json();
      if (response.ok) {
        showToast("Comment posted.", "success");
        setCommentInputs({ ...commentInputs, [postId]: "" });
        await fetchPosts();
        await fetchComments(postId);
      } else {
        showToast(result.message || "Failed to post comment.", "error");
      }
    } catch (err) {
      showToast("Error posting comment: " + err.message, "error");
    }
  };

  const handleReaction = async (postId, type) => {
    try {
      const endpoint = `${API_BASE}/api/posts/${postId}/${type}/`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok && result.data) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...result.data } : p)));
      } else {
        showToast(result.message || `Failed to ${type} post.`, "error");
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (bioDraft !== profile.bio) {
        const res = await fetch(`${API_BASE}/api/profile/${username}/bio/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ bio: bioDraft }),
        });
        if (!res.ok) throw new Error("bio");
        const { bio } = await res.json();
        setProfile((p) => ({ ...p, bio }));
      }
      if (avatarFile) {
        const form = new FormData();
        form.append("image", avatarFile);
        const res = await fetch(`${API_BASE}/api/profile/profile-picture/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!res.ok) throw new Error("avatar");
        const responseData = await res.json();
        const avatarUrl = `${API_BASE}${responseData.data.profile_picture}?t=${Date.now()}`;
        setAvatarLoaded(false);
        setProfile((p) => ({ ...p, avatar: avatarUrl }));
        setAvatarFile(null);
        setAvatarError(false);
      }
      showToast("Profile updated", "success");
    } catch {
      setSaveError("Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (token && username) {
      fetchProfile();
      fetchPosts();
    }
  }, [token, username]);

  if (!profile) {
    return <div className="d-flex justify-content-center pt-5"><Spinner animation="border" /></div>;
  }

  const avatarSrc = avatarFile
    ? URL.createObjectURL(avatarFile)
    : avatarError
      ? DEFAULT_PROFILE_IMAGE
      : profile.avatar;

  return (
    <div className="main-bg min-vh-100 d-flex flex-column">
      <Navbar active="Profile" />
      <motion.main className="container mx-auto px-4 py-8 flex-grow-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Profile Info */}
          <Card className="shadow-sm mb-4">
            <Card.Body className="d-flex align-items-center">
              <input
                type="file"
                accept="image/png, image/jpeg"
                ref={fileInputRef}
                className="d-none"
                onChange={(e) => e.target.files[0] && setAvatarFile(e.target.files[0])}
              />
              <div
                style={{ position: "relative", width: 128, height: 128, marginRight: 16 }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Image
                  roundedCircle
                  src={avatarSrc}
                  key={avatarSrc}
                  alt="avatar"
                  width={128}
                  height={128}
                  onLoad={() => setAvatarLoaded(true)}
                  onError={() => setAvatarError(true)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    objectFit: "cover",
                    cursor: "pointer",
                    opacity: avatarLoaded ? 1 : 0,
                    transition: "opacity 0.3s",
                  }}
                />
                {!avatarLoaded && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: 128,
                      height: 128,
                      borderRadius: "50%",
                      backgroundColor: "#e0e0e0",
                    }}
                  />
                )}
              </div>

              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h3 className="mb-0">{profile.username}</h3>
                  <Button variant="outline-dark" size="sm" onClick={logout}>
                    Log out
                  </Button>
                </div>

                <Form.Group controlId="bioTextarea">
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value)}
                    placeholder="Write something about yourself..."
                  />
                </Form.Group>
                {saveError && <div className="text-danger mt-2">{saveError}</div>}

                <div className="mt-2 d-flex gap-2">
                  <Button variant="success" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setBioDraft(profile.bio);
                      setAvatarFile(null);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        {/* Posts Grid */}
        <h2 className="mb-4 text-lg font-semibold text-green-700">Your Posts</h2>
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loadingPosts ? (
            <p>Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-zinc-500">No posts yet.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post"
                    onError={(e) => (e.target.src = DEFAULT_POST_IMAGE)}
                    className="h-48 w-full object-cover"
                  />
                )}
                <div className="flex items-center gap-3 px-4 pt-3">
                  <img
                    src={
                      post.creator_profile_image?.startsWith("http")
                        ? post.creator_profile_image
                        : `${API_BASE}${post.creator_profile_image || DEFAULT_PROFILE_IMAGE}`
                    }
                    onError={(e) => (e.target.src = DEFAULT_PROFILE_IMAGE)}
                    alt={post.creator_username}
                    className="h-8 w-8 rounded-full object-cover border"
                  />
                  <span className="text-sm font-medium">{post.creator_username}</span>
                </div>
                <div className="p-4 flex-1">
                  <p className="text-sm text-zinc-500">{post.text}</p>
                </div>
                <div className="flex items-center gap-4 border-t px-4 py-3 text-sm text-zinc-600">
                  <button onClick={() => handleReaction(post.id, "like")} className={`flex items-center gap-1 ${post.is_user_liked ? "text-green-600 font-semibold" : "hover:text-green-600"}`}>
                    👍 {post.like_count}
                  </button>
                  <button onClick={() => handleReaction(post.id, "dislike")} className={`flex items-center gap-1 ${post.is_user_disliked ? "text-red-600 font-semibold" : "hover:text-red-600"}`}>
                    👎 {post.dislike_count}
                  </button>
                </div>
                <div className="border-t px-4 py-3">
                  <input type="text" placeholder="Write a comment..." value={commentInputs[post.id] || ""} onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })} className="w-full rounded border p-1 text-sm" />
                  <button onClick={() => handleCreateComment(post.id)} disabled={!commentInputs[post.id]} className="mt-2 w-full rounded bg-green-600 py-1 text-sm text-white hover:bg-green-700">
                    Post Comment
                  </button>
                  <button onClick={() => { setViewingCommentsPostId(post.id); fetchComments(post.id); }} className="mt-2 text-xs text-blue-600 hover:underline">
                    View all comments
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Comments Modal */}
        <AnimatePresence>
          {viewingCommentsPostId !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold text-green-700">All Comments</h2>
                <div className="flex justify-end">
                  <select value={commentSortOrder} onChange={(e) => setCommentSortOrder(e.target.value)} className="mb-2 rounded border px-2 py-1 text-sm text-zinc-700">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
                {postComments[viewingCommentsPostId]?.length > 0 ? (
                  <div className="space-y-4 text-sm text-zinc-800">
                    {[...postComments[viewingCommentsPostId]]
                      .sort((a, b) => commentSortOrder === "newest" ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date))
                      .map((comment) => (
                        <div key={comment.id} className="relative rounded-md border px-3 py-2">
                          <div className="flex items-center justify-between pr-6">
                            <div className="flex items-center gap-2">
                              <img
                                src={
                                  comment.author_profile_image?.startsWith("http")
                                    ? comment.author_profile_image
                                    : `${API_BASE}${comment.author_profile_image || DEFAULT_PROFILE_IMAGE}`
                                }
                                onError={(e) => (e.target.src = DEFAULT_PROFILE_IMAGE)}
                                alt={comment.author_username}
                                className="h-6 w-6 rounded-full object-cover border"
                              />                              <span className="text-sm font-medium">{comment.author_username}</span>
                            </div>
                            <span className="text-xs text-zinc-400">{dayjs(comment.date).fromNow()}</span>
                          </div>
                          <div>{comment.content}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No comments yet.</p>
                )}
                <div className="flex justify-end pt-4">
                  <button onClick={() => setViewingCommentsPostId(null)} className="rounded-lg border border-green-600 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50">
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  );
}
