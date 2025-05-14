import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Post from "../components/Post";
import SkeletonCard from "../components/SkeletonCard";
import { useAuth } from "../Login/AuthContent";
import { showToast } from "../util/toast";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export default function Community() {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", description: "", image: "" });
  const [error, setError] = useState(null);

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock API call
      await new Promise((r) => setTimeout(r, 400));
      const MOCK_POSTS = [
        {
          id: 1,
          title: "My Zero Waste Journey",
          description: "Sharing my experience with reducing waste.",
          image: "https://cdn.vectorstock.com/i/2000v/37/95/text-placeholder-healthy-color-vegetables-vector-6263795.avif",
          like_count: 10,
          liked: false,
        },
        {
          id: 2,
          title: "Composting Tips",
          description: "How to start composting at home.",
          image: "https://res.cloudinary.com/colbycloud-next-cloudinary/image/upload/c_fill,w_3840,h_2880,g_auto/f_auto/q_auto/v1/images/mountain?_a=BAVAZGDW0",
          like_count: 5,
          liked: true,
        },
      ];
      setPosts(MOCK_POSTS);
    } catch (err) {
      setError(err.message);
      showToast("Error fetching posts: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.description.trim()) {
      showToast("Title and description are required.", "error");
      return;
    }
    try {
      // Mock API call
      setPosts((prev) => [...prev, { ...newPost, id: Date.now(), like_count: 0, liked: false }]);
      showToast("Post created successfully!", "success");
      setNewPost({ title: "", description: "", image: "" });
      setIsCreating(false);
    } catch (err) {
      setError(err.message);
      showToast("Error creating post: " + err.message, "error");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="main-bg min-vh-100 d-flex flex-column">
      <Navbar active="Community" />
      <motion.main
        className="container mx-auto px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Community</h1>
          <button
            onClick={() => setIsCreating(true)}
            className="rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-600"
          >
            Create Post
          </button>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy={isLoading}>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : posts.map((post) => (
                <Post key={post.id} post={post} />
              ))}
        </section>

        {/* Create Post Modal */}
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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="Enter post title"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Enter post description"
                      value={newPost.description}
                      onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700">
                      Image URL (optional)
                    </label>
                    <input
                      type="url"
                      placeholder="Enter image URL"
                      value={newPost.image}
                      onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="rounded-lg border px-4 py-2 text-sm transition hover:bg-zinc-200 dark:hover:bg-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-600"
                  >
                    Create
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