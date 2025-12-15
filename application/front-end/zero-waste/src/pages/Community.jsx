import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../providers/AuthContext";
import { useTheme } from "../providers/ThemeContext";
import { useLanguage } from "../providers/LanguageContext";
import { showToast } from "../utils/toast";
import { usePosts } from "../hooks/usePosts";
import { useComments } from "../hooks/useComments";
import { postsService } from "../services/postsService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const API_BASE = import.meta.env.VITE_API_URL;
const DEFAULT_PROFILE_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541";
const DEFAULT_POST_IMAGE = "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png";

export default function Community() {
  const { token } = useAuth();
  const { currentTheme } = useTheme();
  const { t, isRTL, language } = useLanguage();
  const [pageSize, setPageSize] = useState(9);
  const {
    posts,
    postsLoading: isLoading,
    createPost,
    createLoading: isCreating,
    toggleLike,
    toggleDislike,
    savedPosts,
    savedPostIds,
    savePost,
    unsavePost,
    fetchSavedPosts,
    fetchPosts,
    postsResponse,
    setPostsResponse,
  } = usePosts(language, pageSize);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    postComments,
    commentInputs,
    commentLoading,
    fetchComments,
    createComment,
    reportComment,
    updateCommentInput,
  } = useComments();

  const [newPost, setNewPost] = useState({ description: "", image: null });
  const [sortOption, setSortOption] = useState("recent");
  const [reportingId, setReportingId] = useState(null);
  const [reason, setReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [showingSaved, setShowingSaved] = useState(false);
  const [viewingCommentsPostId, setViewingCommentsPostId] = useState(null);
  const [reportingCommentId, setReportingCommentId] = useState(null);
  const [commentReportReason, setCommentReportReason] = useState("");
  const [commentReportDescription, setCommentReportDescription] = useState("");
  const [commentSortOrder, setCommentSortOrder] = useState("newest");
  const [isPaginating, setIsPaginating] = useState(false);
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);
  const [processingPosts, setProcessingPosts] = useState(new Set());
  const postsContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch posts on mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Scroll to top when pagination occurs
  useEffect(() => {
    if (shouldScrollToTop && postsContainerRef.current) {
      postsContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShouldScrollToTop(false);
    }
  }, [posts, shouldScrollToTop]);

  // Pagination handlers
  const handleNextPage = async () => {
    const nextUrl = postsResponse?.pagination?.next || postsResponse?.next;
    if (nextUrl) {
      setIsPaginating(true);
      try {
        const data = await postsService.getPostsFromUrl(nextUrl, token, language, pageSize);
        setPostsResponse(data);
        setShouldScrollToTop(true);
      } catch (error) {
        showToast(t('common.error', 'An error occurred'), "error");
      } finally {
        setIsPaginating(false);
      }
    }
  };

  const handlePreviousPage = async () => {
    const prevUrl = postsResponse?.pagination?.previous || postsResponse?.previous;
    if (prevUrl) {
      setIsPaginating(true);
      try {
        const data = await postsService.getPostsFromUrl(prevUrl, token, language, pageSize);
        setPostsResponse(data);
        setShouldScrollToTop(true);
      } catch (error) {
        showToast(t('common.error', 'An error occurred'), "error");
      } finally {
        setIsPaginating(false);
      }
    }
  };

  // Calculate current page number from pagination URLs
  const getCurrentPage = () => {
    const prevUrl = postsResponse?.pagination?.previous || postsResponse?.previous;
    const nextUrl = postsResponse?.pagination?.next || postsResponse?.next;

    if (prevUrl) {
      const urlObj = new URL(prevUrl, window.location.origin);
      const prevPage = parseInt(urlObj.searchParams.get('page') || '1');
      return prevPage + 1;
    } else if (nextUrl) {
      return 1;
    }
    // If we have posts but no next/prev, we might be on page 1 of 1, or just page 1
    // For safety, assume 1 if we can't determine otherwise
    return 1;
  };

  const getTotalPages = () => {
    // Check both nested and flat structure
    const count = postsResponse?.pagination?.count ?? postsResponse?.count;

    if (count && pageSize) {
      return Math.ceil(count / pageSize);
    }
    return 1;
  };


  // Posts are now managed by usePosts hook - no need for fetchPosts function

  const handleCreatePost = async () => {
    if (!newPost.description.trim()) {
      showToast(t('community.pleaseAddDescription', 'Please add a description'), "error");
      return;
    }

    try {
      await createPost(newPost);
      setNewPost({ description: "", image: null });
      setShowCreateForm(false);
      showToast(t('community.postCreated', 'Post created successfully!'), "success");
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleLike = async (postId, isLiked) => {
    if (processingPosts.has(postId)) return;
    setProcessingPosts(prev => new Set(prev).add(postId));
    try {
      await toggleLike(postId, isLiked);
      showToast(isLiked ? t('community.unliked', 'Unliked') : t('community.liked', 'Liked!'), "success");
    } catch (error) {
      console.error("Error updating like:", error);
    } finally {
      setProcessingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleDislike = async (postId, isDisliked) => {
    if (processingPosts.has(postId)) return;
    setProcessingPosts(prev => new Set(prev).add(postId));
    try {
      await toggleDislike(postId, isDisliked);
      showToast(isDisliked ? t('community.undisliked', 'Undisliked') : t('community.disliked', 'Disliked'), "success");
    } catch (error) {
      console.error("Error updating dislike:", error);
    } finally {
      setProcessingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleSavePost = async (postId) => {
    if (processingPosts.has(postId)) return;
    setProcessingPosts(prev => new Set(prev).add(postId));
    try {
      await savePost(postId);
      showToast(t('community.postSaved', 'Post saved!'), "success");
    } catch (error) {
      console.error("Error saving post:", error);
    } finally {
      setProcessingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleUnsavePost = async (postId) => {
    if (processingPosts.has(postId)) return;
    setProcessingPosts(prev => new Set(prev).add(postId));
    try {
      await unsavePost(postId);
      showToast(t('community.postUnsaved', 'Post unsaved!'), "success");
    } catch (error) {
      console.error("Error unsaving post:", error);
    } finally {
      setProcessingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };


  const handleAddComment = async (postId) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    try {
      await createComment(postId, content);
      showToast(t('community.commentAdded', 'Comment added!'), "success");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };


  const handleReportPost = async () => {
    if (!reason.trim() || !reportDescription.trim()) {
      showToast(t('community.provideReasonDescription', 'Please provide both reason and description'), "error");
      return;
    }

    try {
      await postsService.reportPost(reportingId, reason, reportDescription, token);
      showToast(t('community.postReportedSuccess', 'Post reported successfully'), "success");
      setReportingId(null);
      setReason("");
      setReportDescription("");
    } catch (error) {
      console.error("Error reporting post:", error);
    }
  };

  const handleReportComment = async () => {
    if (!commentReportReason.trim() || !commentReportDescription.trim()) {
      showToast(t('community.provideReasonDescription', 'Please provide both reason and description'), "error");
      return;
    }

    try {
      await reportComment(reportingCommentId, commentReportReason, commentReportDescription);
      showToast(t('community.commentReportedSuccess', 'Comment reported successfully'), "success");
      setReportingCommentId(null);
      setCommentReportReason("");
      setCommentReportDescription("");
    } catch (error) {
      console.error("Error reporting comment:", error);
    }
  };


  const closeModals = () => {
    setReportingId(null);
    setReason("");
    setReportDescription("");
  };

  const sortedPosts = useMemo(() => {
    if (!posts || !Array.isArray(posts)) return [];
    return [...posts].sort((a, b) => {
      if (sortOption === "likes") return b.like_count - a.like_count;
      return new Date(b.date) - new Date(a.date);
    });
  }, [posts, sortOption]);

  return (
    <motion.main
      ref={postsContainerRef}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1
          className="text-2xl sm:text-3xl font-bold"
          style={{ color: currentTheme.text }}
        >
          {t('community.title', 'Community')}
        </h1>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <label
              className="text-sm font-medium"
              style={{ color: currentTheme.text }}
            >
              {t('common.itemsPerPage', 'Items per page')}:
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg px-3 py-1.5 text-sm border"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                borderColor: currentTheme.border
              }}
            >
              <option value={3}>3</option>
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
              <option value={15}>15</option>
              <option value={18}>18</option>
              <option value={21}>21</option>
              <option value={24}>24</option>
            </select>
          </div>
          <button
            onClick={() => {
              setShowingSaved(!showingSaved);
              if (!showingSaved) fetchSavedPosts();
            }}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:opacity-80"
            style={{
              borderColor: currentTheme.border,
              color: currentTheme.text,
              backgroundColor: showingSaved ? currentTheme.secondary + '15' : 'transparent'
            }}
          >
            {showingSaved ? t('community.showAll', 'Show All Posts') : t('community.showSaved', 'Show Saved Posts')}
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90"
            style={{
              backgroundColor: currentTheme.secondary,
              color: currentTheme.background
            }}
          >
            {t('community.createPost', 'Create Post')}
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-lg opacity-70" style={{ color: currentTheme.text }}>
            {t('community.loadingPosts', 'Loading posts...')}
          </div>
        </div>
      ) : (showingSaved ? (savedPosts || []) : sortedPosts).length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-lg opacity-70" style={{ color: currentTheme.text }}>
            {showingSaved ? t('community.noSavedPosts', 'No saved posts yet.') : t('community.noPosts', 'No posts yet. Be the first to share!')}
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Pagination Loading Overlay */}
          {isPaginating && (
            <div
              className="absolute inset-0 z-10 rounded-xl"
              style={{
                backgroundColor: currentTheme.background,
                opacity: 0.7,
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)'
              }}
            />
          )}
          <section
            className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={{
              filter: isPaginating ? 'blur(4px)' : 'none',
              pointerEvents: isPaginating ? 'none' : 'auto',
              transition: 'filter 0.2s ease'
            }}
          >
            {(showingSaved ? (savedPosts || []) : sortedPosts).map((post) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative flex flex-col rounded-xl border shadow-md hover:shadow-lg transition-shadow duration-300"
                style={{
                  backgroundColor: currentTheme.background,
                  borderColor: currentTheme.border
                }}
              >
                {/* Report button */}
                <button
                  onClick={() => {
                    setReportingId(post.id);
                    setReason("");
                  }}
                  className="absolute top-2 z-10 rounded-lg p-1.5 backdrop-blur-sm transition-opacity hover:opacity-100 opacity-60"
                  style={{
                    backgroundColor: currentTheme.background + 'E6',
                    border: `1px solid ${currentTheme.border}`,
                    ...(isRTL ? { left: '0.5rem' } : { right: '0.5rem' })
                  }}
                  title={t('common.report', 'Report this post')}
                >
                  <span className="text-sm">⚠️</span>
                </button>

                {/* Post image */}
                {post.image_url && (
                  <div className="relative overflow-hidden rounded-t-xl">
                    <img
                      src={post.image_url}
                      alt="Post"
                      onError={(e) => (e.target.src = DEFAULT_POST_IMAGE)}
                      className="w-full h-52 object-cover"
                    />
                  </div>
                )}

                {/* Content container */}
                <div className="flex flex-col flex-1">
                  {/* Creator info & timestamp */}
                  <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
                    <img
                      src={
                        post.creator_profile_image?.startsWith("http")
                          ? post.creator_profile_image
                          : `${API_BASE}${post.creator_profile_image || DEFAULT_PROFILE_IMAGE}`
                      }
                      alt={post.creator_username}
                      onError={(e) => (e.target.src = DEFAULT_PROFILE_IMAGE)}
                      className="h-9 w-9 rounded-full object-cover ring-2"
                      style={{ ringColor: currentTheme.border }}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <a
                        href={`/profile/${post.creator_username}`}
                        className="text-sm font-semibold hover:underline truncate"
                        style={{ color: currentTheme.text }}
                      >
                        {post.creator_username}
                      </a>
                      <span className="text-xs opacity-50" style={{ color: currentTheme.text }}>
                        {dayjs(post.date).fromNow()}
                      </span>
                    </div>
                  </div>

                  {/* Post text */}
                  <div className="px-4 pb-3">
                    <p className="text-sm leading-relaxed break-words" style={{ color: currentTheme.text, opacity: 0.9 }}>
                      {post.text}
                    </p>
                  </div>

                  {/* Interaction buttons */}
                  <div
                    className="flex items-center gap-2 border-t px-4 py-2.5 mt-auto"
                    style={{ borderColor: currentTheme.border }}
                  >
                    <button
                      onClick={() => handleLike(post.id, post.is_user_liked)}
                      disabled={processingPosts.has(post.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all duration-150 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{
                        backgroundColor: post.is_user_liked ? currentTheme.secondary + '15' : 'transparent',
                        color: post.is_user_liked ? currentTheme.secondary : currentTheme.text,
                        fontWeight: post.is_user_liked ? '600' : '500'
                      }}
                    >
                      <span>👍</span>
                      <span className="text-sm">{post.like_count}</span>
                    </button>

                    <button
                      onClick={() => handleDislike(post.id, post.is_user_disliked)}
                      disabled={processingPosts.has(post.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all duration-150 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{
                        backgroundColor: post.is_user_disliked ? currentTheme.secondary + '15' : 'transparent',
                        color: post.is_user_disliked ? currentTheme.secondary : currentTheme.text,
                        fontWeight: post.is_user_disliked ? '600' : '500',
                        opacity: post.is_user_disliked ? 1 : 0.7
                      }}
                    >
                      <span>👎</span>
                      <span className="text-sm">{post.dislike_count}</span>
                    </button>

                    <div className="ml-auto">
                      {savedPostIds.has(post.id) ? (
                        <button
                          onClick={() => handleUnsavePost(post.id)}
                          disabled={processingPosts.has(post.id)}
                          className="p-1.5 rounded-lg transition-all duration-150 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          style={{
                            color: currentTheme.secondary,
                            backgroundColor: currentTheme.secondary + '15'
                          }}
                          title={t('community.unsave', 'Unsave')}
                        >
                          <span className="text-lg">🔖</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSavePost(post.id)}
                          disabled={processingPosts.has(post.id)}
                          className="p-1.5 rounded-lg transition-all duration-150 hover:scale-110 opacity-50 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                          style={{ color: currentTheme.text }}
                          title={t('community.save', 'Save')}
                        >
                          <span className="text-lg">📌</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comment input section */}
                  <div className="border-t px-4 py-3" style={{ borderColor: currentTheme.border }}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t('community.writeComment', 'Write a comment...')}
                        value={commentInputs[post.id] || ""}
                        onChange={(e) => updateCommentInput(post.id, e.target.value)}
                        className="flex-1 min-w-0 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-all"
                        style={{
                          backgroundColor: currentTheme.background,
                          borderColor: currentTheme.border,
                          color: currentTheme.text
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={!commentInputs[post.id]}
                        className="px-4 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                        style={{
                          backgroundColor: currentTheme.secondary,
                          color: currentTheme.background
                        }}
                      >
                        💬
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setViewingCommentsPostId(post.id);
                        fetchComments(post.id);
                      }}
                      className="mt-2 text-xs font-medium hover:underline"
                      style={{ color: currentTheme.secondary, opacity: 0.8 }}
                    >
                      {t('community.viewComments', 'View all comments')}
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </section>
        </div>
      )}

      <AnimatePresence>
        {showCreateForm && (
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
              className="w-full max-w-md rounded-lg border p-6"
              style={{
                backgroundColor: currentTheme.background,
                borderColor: currentTheme.border
              }}
            >
              <h2 className="text-lg font-semibold mb-2" style={{ color: currentTheme.text }}>
                {t('community.createPost', 'Create Post')}
              </h2>
              <p className="text-sm mb-4" style={{ color: currentTheme.text, opacity: 0.7 }}>
                {t('community.shareThoughts', 'Share your thoughts or experiences with the community.')}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>
                    {t('community.description', 'Description')}
                  </label>
                  <textarea
                    rows={4}
                    placeholder={t('community.writeSomething', 'Write something...')}
                    value={newPost.description}
                    onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                    className="w-full resize-none rounded-lg border px-3 py-2 text-sm"
                    style={{
                      backgroundColor: currentTheme.background,
                      borderColor: currentTheme.border,
                      color: currentTheme.text
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>
                    {t('community.uploadImage', 'Upload Image (optional)')}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => setNewPost({ ...newPost, image: e.target.files[0] })}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
                      style={{
                        backgroundColor: currentTheme.hover,
                        color: currentTheme.text,
                        borderColor: currentTheme.border
                      }}
                    >
                      {t('community.chooseFile', 'Choose File')}
                    </button>
                    <span className="text-sm opacity-70" style={{ color: currentTheme.text }}>
                      {newPost.image ? newPost.image.name : t('community.noFileSelected', 'No file selected')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-lg border px-4 py-2 text-sm hover:opacity-80"
                  style={{
                    borderColor: currentTheme.border,
                    color: currentTheme.text
                  }}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={isCreating}
                  className="rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: currentTheme.secondary,
                    color: currentTheme.background
                  }}
                >
                  {isCreating ? t('common.creating', 'Creating...') : t('community.create', 'Create')}
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
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="w-full max-w-md space-y-4 rounded-2xl p-6 shadow-lg border" style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border }}>
              <h2 className="text-lg font-semibold" style={{ color: currentTheme.text }}>{t('community.reportPost', 'Report Post')}</h2>
              <p className="text-sm opacity-70" style={{ color: currentTheme.text }}>{t('community.reportDescription', "Let us know what's wrong with this post.")}</p>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>{t('community.reason', 'Reason')}</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }}>
                  <option value="">{t('community.selectReason', 'Select a reason')}</option>
                  <option value="SPAM">{t('community.spam', 'Spam')}</option>
                  <option value="INAPPROPRIATE">{t('community.inappropriate', 'Inappropriate')}</option>
                  <option value="HARASSMENT">{t('community.harassment', 'Harassment')}</option>
                  <option value="MISLEADING">{t('community.misleading', 'Misleading or Fake')}</option>
                  <option value="OTHER">{t('community.other', 'Other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>{t('community.description', 'Description')}</label>
                <textarea rows={5} value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} placeholder={t('community.explainBriefly', 'Please explain briefly…')} className="w-full resize-none rounded-xl border px-4 py-3" style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }} />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={closeModals} className="rounded-lg border px-4 py-2 text-sm hover:opacity-80" style={{ borderColor: currentTheme.border, color: currentTheme.text }}>
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={async () => {
                    if (!reason || !reportDescription.trim()) return;
                    await handleReportPost();
                    closeModals();
                  }}
                  disabled={!reason || !reportDescription.trim()}
                  className="rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: currentTheme.secondary, color: currentTheme.background }}
                >
                  {t('common.submit', 'Submit')}
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
              className="w-full max-w-xl space-y-4 rounded-2xl p-6 shadow-lg border max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border }}
            >
              <h2 className="text-lg font-semibold" style={{ color: currentTheme.text }}>{t('community.allComments', 'All Comments')}</h2>
              <div className="flex justify-end">
                <select
                  value={commentSortOrder}
                  onChange={(e) => setCommentSortOrder(e.target.value)}
                  className="mb-2 rounded border px-2 py-1 text-sm"
                  style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }}
                >
                  <option value="newest">{t('community.newestFirst', 'Newest First')}</option>
                  <option value="oldest">{t('community.oldestFirst', 'Oldest First')}</option>
                </select>
              </div>
              {postComments[viewingCommentsPostId]?.length > 0 ? (
                <div className="space-y-4 text-sm" style={{ color: currentTheme.text }}>
                  {(postComments[viewingCommentsPostId] || [])
                    .sort((a, b) =>
                      commentSortOrder === "newest"
                        ? new Date(b.date) - new Date(a.date)
                        : new Date(a.date) - new Date(b.date)
                    )
                    .map((comment) => (
                      <div key={comment.id} className="relative rounded-md border px-3 py-2" style={{ borderColor: currentTheme.border }}>
                        <div className="flex items-center justify-between pr-6">
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                comment.author_profile_image?.startsWith("http")
                                  ? comment.author_profile_image
                                  : `${API_BASE}${comment.author_profile_image || DEFAULT_PROFILE_IMAGE}`
                              }
                              alt={comment.author_username}
                              onError={(e) => (e.target.src = DEFAULT_PROFILE_IMAGE)}
                              className="h-6 w-6 rounded-full object-cover border"
                              style={{ borderColor: currentTheme.border }}
                            />
                            <a
                              href={`/profile/${comment.author_username}`}
                              className="text-sm font-medium hover:underline"
                              style={{ color: currentTheme.text }}
                            >
                              {comment.author_username}
                            </a>
                          </div>
                          <span className="text-xs opacity-50" style={{ color: currentTheme.text }}>{dayjs(comment.date).fromNow()}</span>
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
                <p className="text-sm opacity-70" style={{ color: currentTheme.text }}>{t('community.noComments', 'No comments yet.')}</p>
              )}

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setViewingCommentsPostId(null)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:opacity-80"
                  style={{ borderColor: currentTheme.border, color: currentTheme.text }}
                >
                  {t('common.close', 'Close')}
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
              className="w-full max-w-md space-y-4 rounded-2xl p-6 shadow-lg border"
              style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border }}
            >
              <h2 className="text-lg font-semibold" style={{ color: currentTheme.text }}>{t('community.reportComment', 'Report Comment')}</h2>
              <p className="text-sm opacity-70" style={{ color: currentTheme.text }}>
                {t('community.reportCommentDescription', "Let us know what's wrong with this comment.")}
              </p>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>{t('community.reason', 'Reason')}</label>
                <select
                  value={commentReportReason}
                  onChange={(e) => setCommentReportReason(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }}
                >
                  <option value="">{t('community.selectReason', 'Select a reason')}</option>
                  <option value="SPAM">{t('community.spam', 'Spam')}</option>
                  <option value="INAPPROPRIATE">{t('community.inappropriate', 'Inappropriate')}</option>
                  <option value="HARASSMENT">{t('community.harassment', 'Harassment')}</option>
                  <option value="MISLEADING">{t('community.misleading', 'Misleading or Fake')}</option>
                  <option value="OTHER">{t('community.other', 'Other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>{t('community.description', 'Description')}</label>
                <textarea
                  rows={4}
                  value={commentReportDescription}
                  onChange={(e) => setCommentReportDescription(e.target.value)}
                  placeholder={t('community.explainBriefly', 'Please explain briefly…')}
                  className="w-full resize-none rounded-xl border px-4 py-3"
                  style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setReportingCommentId(null)}
                  className="rounded-lg border px-4 py-2 text-sm hover:opacity-80"
                  style={{ borderColor: currentTheme.border, color: currentTheme.text }}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={async () => {
                    if (!commentReportReason || !commentReportDescription.trim()) return;
                    await handleReportComment();
                    setReportingCommentId(null);
                  }}
                  disabled={!commentReportReason || !commentReportDescription.trim()}
                  className="rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: currentTheme.secondary, color: currentTheme.background }}
                >
                  {t('common.submit', 'Submit')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination Controls - Only show for regular posts, not saved posts */}
      {!isLoading && !showingSaved && posts.length > 0 && (
        <div className="flex justify-center items-center gap-4 mt-8 mb-4">
          <button
            onClick={handlePreviousPage}
            disabled={!(postsResponse?.pagination?.previous || postsResponse?.previous) || isPaginating}
            className="px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{
              backgroundColor: currentTheme.secondary,
              color: currentTheme.background
            }}
          >
            ← {t('common.previous', 'Previous')}
          </button>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium" style={{ color: currentTheme.text }}>
              {t('common.page', 'Page')} {getCurrentPage()} / {getTotalPages()}
            </span>
            <span className="text-xs opacity-70" style={{ color: currentTheme.text }}>
              {(postsResponse?.pagination?.count || postsResponse?.count) ? `${t('common.total', 'Total')}: ${postsResponse?.pagination?.count || postsResponse?.count}` : ''}
            </span>
          </div>
          <button
            onClick={handleNextPage}
            disabled={!(postsResponse?.pagination?.next || postsResponse?.next) || isPaginating}
            className="px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{
              backgroundColor: currentTheme.secondary,
              color: currentTheme.background
            }}
          >
            {t('common.next', 'Next')} →
          </button>
        </div>
      )}
    </motion.main>
  );
}
