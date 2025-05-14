// src/pages/Challenges.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SkeletonCard from "../components/SkeletonCard";
import { useAuth } from "../Login/AuthContent";
import { showToast } from "../util/toast.js";
import Navbar from "../components/Navbar";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

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
    const [newChallenge, setNewChallenge] = useState({
        title: "",
        description: "",
        target_amount: "",
        is_public: true,
    });
    const [reportDescription, setReportDescription] = useState("");

    const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
    const [enrolledChallengeIds, setEnrolledChallengeIds] = useState([]);

    const [reportingId, setReportingId] = useState(null);

    /** ------------------------------------------------------------------
     * Helpers
     * ------------------------------------------------------------------*/
    const fetchChallenges = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE}/api/challenges/`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setChallenges(response.data.reverse());

            if (token) {
                await fetchEnrolledChallengeIds();
            }
        } catch (err) {
            setError(err.message);
            showToast("Error fetching challenges: " + err.message, "error");
        } finally {
            setIsLoading(false);
        }
    };


    const handleCreateChallenge = async () => {
        const { title, description, target_amount, is_public } = newChallenge;

        if (!title.trim() || !description.trim() || !target_amount) {
            showToast("All fields except visibility are required.", "error");
            return;
        }

        try {
            const token = localStorage.getItem("accessToken");
            await axios.post(
              `${API_BASE}/api/challenges/`,
              {
                  title: title.trim(),
                  description: description.trim(),
                  target_amount: parseFloat(target_amount),
                  is_public: Boolean(is_public),
              },
              {
                  headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                  },
              }
            );

            showToast("Challenge created successfully!", "success");
            setIsCreating(false);
            setNewChallenge({ title: "", description: "", target_amount: "", is_public: true });
            await fetchChallenges();
        } catch (err) {
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
        setReason("");
        setReportDescription("");
    };

    const handleReport = async (challengeId, reason, description) => {
        try {
            await axios.post(
              `${API_BASE}/api/challenge/${challengeId}/report/`,
              {
                  reason,       // e.g., "spam"
                  description,  // user explanation
              },
              {
                  headers: {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
              }
            );

            showToast("Report submitted. Thank you!", "success");
        } catch (err) {
            showToast("Error reporting challenge: " + err.message, "error");
        }
    };

    const fetchEnrolledChallengeIds = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const response = await axios.get(`${API_BASE}/api/challenges/enrolled/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const ids = response.data.map((entry) => entry.challenge);
            setEnrolledChallengeIds(ids);
        } catch (err) {
            showToast("Error fetching enrolled challenges: " + err.message, "error");
        }
    };


    const handleEnroll = async (challengeId) => {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.post(
              `${API_BASE}/api/challenges/participate/`,
              { challenge: challengeId },
              {
                  headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                  },
              }
            );
            await fetchChallenges();
            showToast("You joined the challenge!", "success");
        } catch (err) {
            if (err.response?.status === 400) {
                showToast("You are already participating or not allowed.", "error");
            } else {
                showToast("Error joining challenge: " + err.message, "error");
            }
        }
    };

    /** ------------------------------------------------------------------
     *  Render helpers
     * ------------------------------------------------------------------*/
    const renderCard = (c) => {
        const pct = Math.min(100, (c.current_progress / c.target_amount) * 100);
        const completed = pct >= 100;

        // format the values to 2f
        const formattedCurrentProgress = parseFloat(c.current_progress).toFixed(2);
        const formattedTargetAmount = parseFloat(c.target_amount).toFixed(2);
        c.current_progress = formattedCurrentProgress;
        c.target_amount = formattedTargetAmount;

        return (
            <div
                key={c.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 p-4">
                    <div>
                        {enrolledChallengeIds.includes(c.id) && (
                          <span className="mb-1 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-800 dark:text-green-200">
                            You're enrolled
                          </span>
                        )}
                        <h3 className="text-lg font-semibold">{c.title}</h3>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                            {c.description}
                        </p>
                    </div>
                    <button
                      onClick={() => {
                          setReportingId(c.id);
                          setReason("");
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
                        {c.current_progress}/{c.target_amount}
                    </span>
                    {token && (
                      <button
                        onClick={() => handleEnroll(c.id)}
                        disabled={enrolledChallengeIds.includes(c.id)}
                        className={`rounded-lg border px-3 py-1 transition ${
                          enrolledChallengeIds.includes(c.id)
                            ? "cursor-not-allowed opacity-50"
                            : "hover:bg-zinc-200 dark:hover:bg-zinc-200"
                        }`}
                      >
                          {enrolledChallengeIds.includes(c.id) ? "Already Joined" : "Join Challenge"}
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
                      onClick={async () => {
                          setShowEnrolledOnly((prev) => !prev);
                          await fetchChallenges();
                      }}
                      className="rounded-xl border px-4 py-2 text-sm transition hover:bg-zinc-200 dark:hover:bg-zinc-200"
                    >
                        {showEnrolledOnly ? "Show All" : "Show Enrolled Only"}
                    </button>
                    <button
                      onClick={() => setIsCreating(true)}
                      className="rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-600"
                    >
                        Create Challenge
                    </button>
                </div>
            </header>

            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {challenges
                    .filter((c) => !showEnrolledOnly || enrolledChallengeIds.includes(c.id))
                    .map(renderCard)}
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
                          <p className="text-sm text-zinc-600 dark:text-zinc-600">
                              Fill out the fields below to add a new sustainability challenge.
                          </p>

                          {/* Title */}
                          <div>
                              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-700">Title</label>
                              <input
                                type="text"
                                placeholder="Enter challenge title"
                                value={newChallenge.title}
                                onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                                className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-zinc-100"
                              />
                          </div>

                          {/* Description */}
                          <div>
                              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-700">Description</label>
                              <textarea
                                rows={4}
                                placeholder="Enter challenge description"
                                value={newChallenge.description}
                                onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                                className="mt-1 w-full resize-none rounded-xl border px-4 py-3 dark:bg-zinc-100"
                              />
                          </div>

                          {/* Target Amount */}
                          <div>
                              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-700">Target Amount</label>
                              <input
                                type="number"
                                placeholder="Enter target amount"
                                value={newChallenge.target_amount}
                                onChange={(e) => setNewChallenge({ ...newChallenge, target_amount: e.target.value })}
                                className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-zinc-100"
                              />
                          </div>

                          {/* Public Toggle */}
                          <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="is_public"
                                checked={newChallenge.is_public}
                                onChange={(e) => setNewChallenge({ ...newChallenge, is_public: e.target.checked })}
                              />
                              <label htmlFor="is_public" className="text-sm text-zinc-700 dark:text-zinc-700">
                                  Make challenge public
                              </label>
                          </div>

                          {/* Action buttons */}
                          <div className="mt-6 flex justify-end gap-3">
                              <button
                                onClick={() => setIsCreating(false)}
                                className="rounded-lg border border-green-600 bg-white px-5 py-2.5 text-sm font-medium text-green-700
              shadow-sm transition hover:bg-green-50 dark:bg-zinc-900 dark:text-green-400 dark:hover:bg-green-400/10"
                              >
                                  Cancel
                              </button>
                              <button
                                onClick={handleCreateChallenge}
                                className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition
              hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-lg dark:bg-zinc-900"
                      >
                          <h2 className="text-lg font-semibold">Report Challenge</h2>
                          <p className="text-sm text-zinc-600 dark:text-zinc-600">
                              Let us know what’s wrong with this challenge.
                          </p>

                          {/* Reason dropdown */}
                          <div>
                              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-700">Reason</label>
                              <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
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

                          {/* Description textarea */}
                          <div>
                              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-700">Description</label>
                              <textarea
                                rows={5}
                                value={reportDescription}
                                onChange={(e) => setReportDescription(e.target.value)}
                                placeholder="Please explain briefly…"
                                className="mt-1 w-full resize-none rounded-xl border px-4 py-3 dark:bg-zinc-100"
                              />
                          </div>

                          {/* Action buttons */}
                          <div className="mt-6 flex justify-end gap-3">
                              <button
                                onClick={closeModals}
                                className="rounded-lg border border-green-600 bg-white px-5 py-2.5 text-sm font-medium text-green-700
              shadow-sm transition hover:bg-green-50 dark:bg-zinc-900 dark:text-green-400 dark:hover:bg-green-400/10"
                              >
                                  Cancel
                              </button>
                              <button
                                onClick={() => {
                                    if (!reason || !reportDescription.trim()) return;
                                    handleReport(reportingId, reason, reportDescription.trim());
                                    closeModals();
                                }}
                                disabled={!reason || !reportDescription.trim()}
                                className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition
              hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
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
