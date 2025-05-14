import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import SkeletonCard from "../components/SkeletonCard";
import { useAuth } from "../Login/AuthContent";
import { showToast } from "../util/toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const API_BASE = import.meta.env.VITE_API_URL;

export default function Community() {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({ description: "", image: "" });
  const [sortOption, setSortOption] = useState("recent");

  const [reportingId, setReportingId] = useState(null);
  const [reason, setReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  const [postComments, setPostComments] = useState({});

  const [savedPosts, setSavedPosts] = useState([]);
  const [showingSaved, setShowingSaved] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [viewingCommentsPostId, setViewingCommentsPostId] = useState(null);

  const [reportingCommentId, setReportingCommentId] = useState(null);
  const [commentReportReason, setCommentReportReason] = useState("");
  const [commentReportDescription, setCommentReportDescription] = useState("");
  const [commentSortOrder, setCommentSortOrder] = useState("newest"); // or "oldest"

  const [savedPostIds, setSavedPostIds] = useState(new Set());


  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/posts/all/`);
      const result = await response.json();
      if (response.ok) {
        setPosts(result.data);
        result.data.forEach((p) => fetchComments(p.id));
      }
      else showToast(result.message || "Failed to fetch posts.", "error");
    } catch (err) {
      showToast("Error fetching posts: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.description.trim()) {
      showToast("Description is required.", "error");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/posts/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newPost.description, image: newPost.image || null }),
      });
      const result = await response.json();
      if (response.ok) {
        showToast("Post created successfully!", "success");
        setNewPost({ description: "", image: "" });
        setIsCreating(false);
        fetchPosts();
      } else {
        showToast(result.message || "Failed to create post.", "error");
      }
    } catch (err) {
      showToast("Error creating post: " + err.message, "error");
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
      if (response.ok) {
        await fetchPosts();
      } else {
        showToast(result.message || `Failed to ${type} post.`, "error");
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/posts/saved/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) {
        setSavedPosts(result.data);
        setSavedPostIds(new Set(result.data.map((p) => p.id)));
      }
      else showToast(result.message || "Failed to fetch saved posts.", "error");
    } catch (err) {
      showToast("Error fetching saved posts: " + err.message, "error");
    }
  };

  const handleSavePost = async (postId) => {
    try {
      const response = await fetch(`${API_BASE}/api/posts/${postId}/save/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) {
        showToast("Post saved.", "success");
        await fetchSavedPosts(); // refresh saved list if showing
      }
      else showToast(result.message || "Failed to save post.", "error");
    } catch (err) {
      showToast("Error saving post: " + err.message, "error");
    }
  };

  const handleUnsavePost = async (postId) => {
    try {
      const response = await fetch(`${API_BASE}/api/posts/${postId}/unsave/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) {
        showToast("Post unsaved.", "success");
        await fetchSavedPosts(); // refresh saved list if showing
      } else {
        showToast(result.message || "Failed to unsave post.", "error");
      }
    } catch (err) {
      showToast("Error unsaving post: " + err.message, "error");
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
        await fetchPosts(); // re-fetch to update comments
        await fetchComments(postId);
      } else {
        showToast(result.message || "Failed to post comment.", "error");
      }
    } catch (err) {
      showToast("Error posting comment: " + err.message, "error");
    }
  };


  const handleReport = async (postId, reason, description) => {
    try {
      await fetch(`${API_BASE}/api/posts/${postId}/report/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, description }),
      });
      showToast("Report submitted successfully.", "success");
    } catch (err) {
      showToast("Error reporting post: " + err.message, "error");
    }
  };

  const handleCommentReport = async (commentId, reason, description) => {
    try {
      await fetch(`${API_BASE}/api/comments/${commentId}/report/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, description }),
      });
      showToast("Comment reported successfully.", "success");
    } catch (err) {
      showToast("Error reporting comment: " + err.message, "error");
    }
  };


  const closeModals = () => {
    setReportingId(null);
    setReason("");
    setReportDescription("");
  };

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (sortOption === "likes") return b.like_count - a.like_count;
      return new Date(b.date) - new Date(a.date);
    });
  }, [posts, sortOption]);

  useEffect(() => {
    fetchPosts();
    fetchSavedPosts();
  }, []);

  return (
    <div className="main-bg min-vh-100 d-flex flex-column">
      <Navbar active="Community" />
      <motion.main className="container mx-auto px-4 py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Community</h1>
          <div className="flex gap-4">
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}
                    className="rounded border px-3 py-2 text-sm">
              <option value="recent">Most Recent</option>
              <option value="likes">Most Liked</option>
            </select>
            <button
              onClick={() => {
                setShowingSaved(!showingSaved);
                if (!showingSaved) fetchSavedPosts();
              }}
              className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-600"
            >
              {showingSaved ? "Show All Posts" : "Show Saved Posts"}
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-600"
            >
              Create Post
            </button>
          </div>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(showingSaved ? savedPosts : sortedPosts).map((post) => (
              <div
                key={post.id}
                className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
              >
                {/* Always top-right report button */}
                <button
                  onClick={() => {
                    setReportingId(post.id);
                    setReason("");
                  }}
                  className="absolute top-2 right-2 z-10 rounded-full bg-white/80 p-1 text-zinc-600 hover:bg-red-100 hover:text-red-600 transition"
                  title="Report this post"
                >
                  &#9888;
                </button>

                {/* Image (optional) */}
                {post.image && (
                  <img src={post.image} alt="Post" className="h-48 w-full object-cover" />
                )}

                {/* Text content fills the space */}
                <div className="p-4 flex-1">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{post.text}</p>
                </div>

                {/* Like / Dislike buttons pinned to bottom */}
                <div className="flex items-center gap-4 border-t border-zinc-100 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                  <button
                    onClick={() => handleReaction(post.id, "like")}
                    className="flex items-center gap-1 transition hover:text-green-600"
                  >
                    👍 {post.like_count}
                  </button>
                  <button
                    onClick={() => handleReaction(post.id, "dislike")}
                    className="flex items-center gap-1 transition hover:text-red-600"
                  >
                    👎 {post.dislike_count}
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    {savedPostIds.has(post.id) ? (
                      <>
                        <span className="text-xs text-red-500">Unsave</span>
                        <button
                          onClick={() => handleUnsavePost(post.id)}
                          className="text-red-500 text-sm hover:underline"
                          title="Unsave this post"
                        >
                          🔖
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-blue-500">Save</span>
                        <button
                          onClick={() => handleSavePost(post.id)}
                          className="text-blue-500 text-sm hover:underline"
                          title="Save this post"
                        >
                          📌
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ""}
                    onChange={(e) =>
                      setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                    }
                    className="w-full rounded-md border px-3 py-1 text-sm dark:bg-zinc-100"
                  />
                  <button
                    onClick={() => handleCreateComment(post.id)}
                    disabled={!commentInputs[post.id]}
                    className="mt-2 w-full rounded bg-green-600 py-1 text-sm text-white hover:bg-green-700"
                  >
                    Post Comment
                  </button>
                  {postComments[post.id]?.length > 0 && (
                    <button
                      onClick={() => setViewingCommentsPostId(post.id)}
                      className="mt-2 text-xs text-blue-600 hover:underline"
                    >
                      View all {postComments[post.id].length} comments
                    </button>
                  )}
                </div>
              </div>
            ))}
        </section>

        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-lg dark:bg-zinc-900"
              >
                <h2 className="text-lg font-semibold text-green-700">Create Post</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-600">
                  Share your thoughts or experiences with the community.
                </p>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-700">Description</label>
                  <textarea
                    rows={4}
                    placeholder="Write something..."
                    value={newPost.description}
                    onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                    className="mt-1 w-full resize-none rounded-xl border px-4 py-3 dark:bg-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-700">Image URL (optional)</label>
                  <input
                    type="url"
                    placeholder="Enter image URL"
                    value={newPost.image}
                    onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-zinc-100"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="rounded-lg border border-green-600 bg-white px-5 py-2.5 text-sm font-medium text-green-700 shadow-sm transition hover:bg-green-50 dark:bg-zinc-900 dark:text-green-400 dark:hover:bg-green-400/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Modal */}
        <AnimatePresence>
          {reportingId !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-lg dark:bg-zinc-900">
                <h2 className="text-lg font-semibold">Report Post</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-600">Let us know what’s wrong with this post.</p>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-700">Reason</label>
                  <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-zinc-100">
                    <option value="">Select a reason</option>
                    <option value="SPAM">Spam</option>
                    <option value="INAPPROPRIATE">Inappropriate</option>
                    <option value="HARASSMENT">Harassment</option>
                    <option value="MISLEADING">Misleading or Fake</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-700">Description</label>
                  <textarea rows={5} value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} placeholder="Please explain briefly…" className="mt-1 w-full resize-none rounded-xl border px-4 py-3 dark:bg-zinc-100" />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={closeModals} className="rounded-lg border border-green-600 bg-white px-5 py-2.5 text-sm font-medium text-green-700 shadow-sm transition hover:bg-green-50 dark:bg-zinc-900 dark:text-green-400 dark:hover:bg-green-400/10">
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!reason || !reportDescription.trim()) return;
                      await handleReport(reportingId, reason, reportDescription.trim());
                      closeModals();
                    }}
                    disabled={!reason || !reportDescription.trim()}
                    className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comments Modal */}
        <AnimatePresence>
          {viewingCommentsPostId !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-lg dark:bg-zinc-100 max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-lg font-semibold text-green-700">All Comments</h2>
                <div className="flex justify-end">
                  <select
                    value={commentSortOrder}
                    onChange={(e) => setCommentSortOrder(e.target.value)}
                    className="mb-2 rounded border px-2 py-1 text-sm text-zinc-700 dark:bg-zinc-200"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
                {postComments[viewingCommentsPostId]?.length > 0 ? (
                  <div className="space-y-4 text-sm text-zinc-800 dark:text-zinc-800">
                    {[...postComments[viewingCommentsPostId]]
                      .sort((a, b) =>
                        commentSortOrder === "newest"
                          ? new Date(b.date) - new Date(a.date)
                          : new Date(a.date) - new Date(b.date)
                      )
                      .map((comment) => (
                        <div key={comment.id} className="relative rounded-md border px-3 py-2 dark:border-zinc-700">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{comment.author_username}</span>
                            <span className="text-xs text-zinc-400">{dayjs(comment.date).fromNow()}</span>
                          </div>
                          <div>{comment.content}</div>
                          <button
                            onClick={() => {
                              setReportingCommentId(comment.id);
                              setCommentReportReason("");
                              setCommentReportDescription("");
                            }}
                            className="absolute top-2 right-2 text-xs text-red-500 hover:underline"
                            title="Report this comment"
                          >
                            &#9888;
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No comments yet.</p>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setViewingCommentsPostId(null)}
                    className="rounded-lg border border-green-600 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 dark:bg-zinc-800 dark:text-green-400"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comment Report Modal */}
        <AnimatePresence>
          {reportingCommentId !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-lg dark:bg-zinc-900"
              >
                <h2 className="text-lg font-semibold">Report Comment</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-600">
                  Let us know what’s wrong with this comment.
                </p>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-700">Reason</label>
                  <select
                    value={commentReportReason}
                    onChange={(e) => setCommentReportReason(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-zinc-100"
                  >
                    <option value="">Select a reason</option>
                    <option value="SPAM">Spam</option>
                    <option value="INAPPROPRIATE">Inappropriate</option>
                    <option value="HARASSMENT">Harassment</option>
                    <option value="MISLEADING">Misleading or Fake</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-700">Description</label>
                  <textarea
                    rows={4}
                    value={commentReportDescription}
                    onChange={(e) => setCommentReportDescription(e.target.value)}
                    placeholder="Please explain briefly…"
                    className="mt-1 w-full resize-none rounded-xl border px-4 py-3 dark:bg-zinc-100"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setReportingCommentId(null)}
                    className="rounded-lg border border-green-600 bg-white px-5 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50 dark:bg-zinc-900 dark:text-green-400 dark:hover:bg-green-400/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!commentReportReason || !commentReportDescription.trim()) return;
                      await handleCommentReport(reportingCommentId, commentReportReason, commentReportDescription.trim());
                      setReportingCommentId(null);
                    }}
                    disabled={!commentReportReason || !commentReportDescription.trim()}
                    className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit
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
