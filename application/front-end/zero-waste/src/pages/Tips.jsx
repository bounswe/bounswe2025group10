import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import SkeletonCard from "../components/SkeletonCard";
import { showToast } from "../util/toast";

export default function Tips() {
  const [tips, setTips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTip, setNewTip] = useState({ title: "", description: "" });
  const [error, setError] = useState(null);

  const fetchTips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock API call
      await new Promise((r) => setTimeout(r, 400));
      const MOCK_TIPS = [
        { id: 1, title: "Use Reusable Bags", description: "Avoid single-use plastic bags by using reusable ones." },
        { id: 2, title: "Compost Food Waste", description: "Turn your food scraps into nutrient-rich compost." },
        { id: 3, title: "Save Water", description: "Fix leaks and use water-saving appliances." },
      ];
      setTips(MOCK_TIPS);
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
      // Mock API call
      setTips((prev) => [...prev, { ...newTip, id: Date.now() }]);
      showToast("Tip created successfully!", "success");
      setNewTip({ title: "", description: "" });
      setIsCreating(false);
    } catch (err) {
      setError(err.message);
      showToast("Error creating tip: " + err.message, "error");
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  return (
    <div className="main-bg min-vh-100 d-flex flex-column">
      <Navbar active="Tips" />
      <motion.main
        className="container mx-auto px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Sustainability Tips</h1>
          <button
            onClick={() => setIsCreating(true)}
            className="rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-600"
          >
            Create Tip
          </button>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy={isLoading}>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : tips.map((tip) => (
                <div
                  key={tip.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{tip.title}</h3>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{tip.description}</p>
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
      </motion.main>
    </div>
  );
}