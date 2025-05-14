// src/pages/Challenges.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SkeletonCard from "../components/SkeletonCard";
import { useAuth } from "../Login/AuthContent";
import { showToast } from "../util/toast.js";
import Navbar from "../components/Navbar";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export default function Challenges() {
    /** ------------------------------------------------------------------
     * Auth & local state
     * ------------------------------------------------------------------*/
    const { token } = useAuth(); // → token may be null for guests

    const [challenges, setChallenges] = useState([]);
    const [reason, setReason] = useState(""); // report textarea state
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newChallenge, setNewChallenge] = useState({ title: "", description: "" });

    const [reportingId, setReportingId] = useState(null);
    const [progressEdit, setProgressEdit] = useState({ id: null, value: "" });

    /** ------------------------------------------------------------------
     * Helpers
     * ------------------------------------------------------------------*/
    const fetchChallenges = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 👉 Replace with real API; mock for now
            // # TODO: GET from /api/challenges/
            await new Promise((r) => setTimeout(r, 400));
            const MOCK = [
                {
                    id: 1,
                    title: "Recycle Five Plastic Bottles",
                    description: "Collect at least five plastic bottles and recycle them.",
                    target_amount: 5,
                    unit: "bottle",
                    difficulty: "Easy",
                    progress: 2, // ← current user’s progress
                },
                {
                    id: 2,
                    title: "Compost Kitchen Scraps for a Week",
                    description: "Compost all veggie & fruit scraps for seven days.",
                    target_amount: 7,
                    unit: "day",
                    difficulty: "Medium",
                    progress: 4,
                },
                {
                    id: 3,
                    title: "Car‑Free Day",
                    description: "Avoid motorised vehicles for 24 hours.",
                    target_amount: 1,
                    unit: "day",
                    difficulty: "Hard",
                    progress: 0,
                },
            ];
            setChallenges(MOCK);
        } catch (err) {
            setError(err.message);
            showToast("Error fetching challenges: " + err.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateChallenge = async () => {
        if (
          !newChallenge.title.trim() ||
          !newChallenge.description.trim() ||
          !newChallenge.target_amount ||
          !newChallenge.unit.trim() ||
          newChallenge.progress === null
        ) {
            showToast("All fields are required.", "error");
            return;
        }
        try {
            // TODO: POST to /api/challenges/
            /* await fetch(`${API_BASE}/api/challenges/`, {
                 method: "POST",
                 headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                 body: JSON.stringify(newChallenge),
            }); */
            setChallenges((prev) => [
                ...prev,
                { ...newChallenge, id: Date.now() },
            ]);
            showToast("Challenge created successfully!", "success");
            setNewChallenge({ title: "", description: "", target_amount: "", unit: "", progress: 0 });
            setIsCreating(false);
        } catch (err) {
            setError(err.message);
            showToast("Error creating challenge: " + err.message, "error");
        }
    };

    useEffect(() => {
        fetchChallenges();
    }, []);

    /** ------------------------------------------------------------------
     *  Local UI state for reporting & progress editing
     * ------------------------------------------------------------------*/
    const closeModals = () => {
        setReportingId(null);
        setProgressEdit({ id: null, value: "" });
        setReason(""); // reset report textarea
    };

    const handleReport = async (id, txt) => {
        // TODO: POST to /api/challenges/:id/report/
        /* await fetch(`${API_BASE}/api/challenges/${id}/report/`, {
             method: "POST",
             headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
             body: JSON.stringify({ reason: txt }),
        });*/
        showToast("Report submitted. Thank you!", "success", 2000);
    };

    const handleProgressUpdate = async (id, amount) => {
        try {
            // TODO: POST to /api/challenges/:id/progress/
            /* await fetch(`${API_BASE}/api/challenges/${id}/progress/`, { ... }) */
            setChallenges((prev) =>
                prev.map((c) => (c.id === id ? {...c, progress: amount} : c))
            );
            await fetchChallenges();
        } catch (err) {
            setError(err.message);
            showToast("Error updating progress: " + err.message, "error");
        }

    };

    /** ------------------------------------------------------------------
     *  Render helpers
     * ------------------------------------------------------------------*/
    const renderCard = (c) => {
        const pct = Math.min(100, (c.progress / c.target_amount) * 100);
        const completed = pct >= 100;

        return (
            <div
                key={c.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 p-4">
                    <div>
                        <h3 className="text-lg font-semibold">{c.title}</h3>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                            {c.description}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setReportingId(c.id);
                            setReason(""); // clear textarea when modal opens
                        }}
                        className="rounded-full p-1 text-zinc-500 hover:bg-zinc-200 hover:text-destructive dark:hover:bg-zinc-200"
                        title="Report this challenge"
                    >
                        &#9888;
                    </button>
                </div>

                {/* Progress bar */}
                <div className="mx-4 mb-4 h-3 rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full ${completed ? "bg-green-500" : "bg-primary"}`}
                    ></div>
                </div>

                {/* Footer with actions */}
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3 text-sm dark:border-zinc-800">
                    <span>
                        {c.progress}/{c.target_amount} {c.unit}
                    </span>
                    {token && (
                        <button
                            onClick={() => setProgressEdit({ id: c.id, value: c.progress })}
                            className="rounded-lg border px-3 py-1 transition hover:bg-zinc-200 dark:hover:bg-zinc-200"
                        >
                            Update progress
                        </button>
                    )}
                </div>
            </div>
        );
    };

    /** ------------------------------------------------------------------
     *  Render page
     * ------------------------------------------------------------------*/
    return (
      <div className="main-bg min-vh-100 d-flex flex-column">
        <Navbar active="Challenges" />
        <motion.main
            className="container mx-auto px-4 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Challenges</h1>
                <div className="flex gap-4">
                    <button
                      onClick={fetchChallenges}
                      className="rounded-xl border px-4 py-2 text-sm transition hover:bg-zinc-200 dark:hover:bg-zinc-200"
                    >
                        Refresh
                    </button>
                    <button
                      onClick={() => setIsCreating(true)}
                      className="rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-600"
                    >
                        Create Challenge
                    </button>
                </div>
            </header>

            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy={isLoading}>
                {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                    : challenges.map(renderCard)}
            </section>

            {/* Create Challenge Modal */}
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
                          <h2 className="text-lg font-semibold text-green-700">Create Challenge</h2>
                          <div className="space-y-4">
                              {/* Title */}
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-700">
                                      Title
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Enter challenge title"
                                    value={newChallenge.title}
                                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                                    className="w-full rounded-lg border px-3 py-2"
                                  />
                              </div>

                              {/* Description */}
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-700">
                                      Description
                                  </label>
                                  <textarea
                                    rows={4}
                                    placeholder="Enter challenge description"
                                    value={newChallenge.description}
                                    onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                                    className="w-full rounded-lg border px-3 py-2"
                                  />
                              </div>

                              {/* Target Amount */}
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-700">
                                      Target Amount
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="Enter target amount"
                                    value={newChallenge.target_amount}
                                    onChange={(e) => setNewChallenge({ ...newChallenge, target_amount: e.target.value })}
                                    className="w-full rounded-lg border px-3 py-2"
                                  />
                              </div>

                              {/* Unit */}
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-700">
                                      Unit
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Enter unit (e.g., bottle, day)"
                                    value={newChallenge.unit}
                                    onChange={(e) => setNewChallenge({ ...newChallenge, unit: e.target.value })}
                                    className="w-full rounded-lg border px-3 py-2"
                                  />
                              </div>

                              {/* Progress */}
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-700">
                                      Progress
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="Enter initial progress"
                                    value={newChallenge.progress}
                                    onChange={(e) => setNewChallenge({ ...newChallenge, progress: e.target.value })}
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
                                onClick={handleCreateChallenge}
                                className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-600"
                              >
                                  Create
                              </button>
                          </div>
                      </motion.div>
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Report modal */}
            <AnimatePresence>
                {reportingId !== null && (
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
                            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-lg dark:bg-zinc-900 bg-zinc-900"
                        >
                            <h2 className="text-lg font-semibold">Report Challenge</h2>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Let us know what’s wrong with this challenge.
                            </p>
                            {/* ── Reason textarea ─────────────────────────────────────────────── */}
                            <textarea
                              id="report-reason"
                              rows={8}                           /* taller default */
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="Reason…"
                              className="mt-3 w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base
             placeholder-zinc-400 shadow-sm transition focus:border-green-500 focus:outline-none focus:ring-2
             focus:ring-green-200 dark:border-zinc-600 dark:bg-zinc-800 dark:placeholder-zinc-500
             dark:focus:border-green-400 dark:focus:ring-green-400/40"
                            />

                            {/* ── Action buttons ─────────────────────────────────────────────── */}
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                  onClick={closeModals}
                                  className="rounded-lg border border-green-600 bg-white px-5 py-2.5 text-sm font-medium text-green-700
               shadow-sm transition hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2
               focus-visible:ring-green-500 dark:bg-zinc-900 dark:text-green-400 dark:hover:bg-green-400/10"
                                >
                                    Cancel
                                </button>

                                <button
                                  onClick={() => {
                                      if (!reason.trim()) return;
                                      handleReport(reportingId, reason.trim());
                                      closeModals();
                                  }}
                                  disabled={!reason.trim()}
                                  className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition
               hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                                >
                                    Submit
                                </button>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress edit modal */}
            <AnimatePresence>
                {progressEdit.id !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    >
                        <motion.form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const valueNum = Number(progressEdit.value);
                                if (!Number.isNaN(valueNum)) {
                                    handleProgressUpdate(progressEdit.id, valueNum);
                                    closeModals();
                                }
                            }}
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 40, opacity: 0 }}
                            className="w-full max-w-xs space-y-4 rounded-2xl bg-white p-6 shadow-lg dark:bg-zinc-900"
                        >
                            <h2 className="text-lg font-semibold">Update Progress</h2>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={progressEdit.value}
                                onChange={(e) => setProgressEdit({ ...progressEdit, value: e.target.value })}
                                className="w-full rounded border px-3 py-2"
                            />
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeModals} className="rounded border px-4 py-2 text-sm">
                                    Cancel
                                </button>
                                <button type="submit" className="rounded bg-primary px-4 py-2 text-sm font-medium text-white">
                                    Save
                                </button>
                            </div>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.main>
      </div>
    );
}
