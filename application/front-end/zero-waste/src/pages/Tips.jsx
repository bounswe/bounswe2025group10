import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import SkeletonCard from "../components/SkeletonCard";
import { showToast } from "../util/toast";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function Tips() {
  const [tips, setTips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTip, setNewTip] = useState({ title: "", description: "" });
  const [error, setError] = useState(null);
  const [reportingId, setReportingId] = useState(null);
  const [reason, setReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  const fetchTips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/api/tips/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTips(response.data.data);
    } catch (err) {
      setError(err.message);
      showToast("Error fetching tips: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTip = async () => {
    if (!newTip.title.trim() || !newTip.description.trim()) {
      showToast("Title and description are required.", "error");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${BASE_URL}/api/tips/create/`,
        {
          title: newTip.title,
          description: newTip.description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchTips();
      showToast("Tip created successfully!", "success");
      setNewTip({ title: "", description: "" });
      setIsCreating(false);
    } catch (err) {
      setError(err.message);
      showToast("Error creating tip: " + err.message, "error");
    }
  };

  const handleLike = async (tipId) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${BASE_URL}/api/tips/${tipId}/like/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchTips(); // Re-fetch updated data
    } catch (err) {
      showToast("Error liking tip: " + err.message, "error");
    }
  };


  const handleDislike = async (tipId) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${BASE_URL}/api/tips/${tipId}/dislike/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchTips(); // Re-fetch updated data
    } catch (err) {
      showToast("Error disliking tip: " + err.message, "error");
    }
  };

  const handleReport = async (tipId, reason, description) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${BASE_URL}/api/tips/${tipId}/report/`,
        {
          reason,
          description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showToast("Report submitted successfully.", "success");
    } catch (err) {
      showToast("Error reporting tip: " + err.message, "error");
    }
  };

  const closeModals = () => {
    setReportingId(null);
    setReason("");
    setReportDescription("");
  };

  useEffect(() => {
    fetchTips();
  }, []);

  return (
    <div className="main-bg min-vh-100 d-flex flex-column">
      <Navbar active="Tips" />
      <motion.main className="container mx-auto px-4 py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Sustainability Tips</h1>
          <button
            onClick={() => setIsCreating(true)}
            className="rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-600"
          >
            Create Tip
          </button>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="p-4 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{tip.title}</h3>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{tip.description}</p>
                  </div>
                  <button
                    onClick={() => setReportingId(tip.id)}
                    className="rounded-full p-1 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-200"
                    title="Report this tip"
                  >
                    &#9888;
                  </button>
                </div>
              </div>
              <div className="mt-auto flex items-center gap-4 border-t border-zinc-100 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                <button
                  onClick={() => handleLike(tip.id)}
                  className={`flex items-center gap-1 transition ${tip.is_user_liked ? "text-green-600 font-semibold" : "hover:text-green-600"}`}
                >
                  👍 {tip.like_count}
                </button>
                <button
                  onClick={() => handleDislike(tip.id)}
                  className={`flex items-center gap-1 transition ${tip.is_user_disliked ? "text-red-600 font-semibold" : "hover:text-red-600"}`}
                >
                  👎 {tip.dislike_count}
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Create Tip Modal */}
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
                <h2 className="text-lg font-semibold text-green-700">Create Tip</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="Enter tip title"
                      value={newTip.title}
                      onChange={(e) => setNewTip({ ...newTip, title: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Enter tip description"
                      value={newTip.description}
                      onChange={(e) => setNewTip({ ...newTip, description: e.target.value })}
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
                    onClick={handleCreateTip}
                    className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-600"
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
                <h2 className="text-lg font-semibold">Report Tip</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-600">
                  Let us know what’s wrong with this tip.
                </p>
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
                    onClick={() => {
                      if (!reason || !reportDescription.trim()) return;
                      handleReport(reportingId, reason, reportDescription.trim());
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
      </motion.main>
    </div>
  );
}