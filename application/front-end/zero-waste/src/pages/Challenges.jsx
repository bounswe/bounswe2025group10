import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import { showToast } from "../utils/toast";
import { useAuth } from "../providers/AuthContext";
import { useTheme } from "../providers/ThemeContext";
import { useLanguage } from "../providers/LanguageContext";
import { useApi } from "../hooks/useApi";
import { challengesService } from "../services/challengesService";

export default function Challenges() {
  const { token } = useAuth();
  const { currentTheme } = useTheme();
  const { t, isRTL } = useLanguage();

  const {
    data: challengesResponse,
    loading: isLoading,
    error,
    execute: refetchChallenges,
    setData: setChallengesResponse,
  } = useApi(
    () => challengesService.getChallenges(token),
    {
      initialData: { results: [] },
      showErrorToast: true,
      errorMessage: 'Failed to fetch challenges',
    }
  );

  // Extract challenges array from paginated response
  const challenges = challengesResponse?.results || [];

  const {
    loading: isCreating,
    execute: createChallenge,
  } = useApi(
    (challengeData) => challengesService.createChallenge(challengeData, token),
    {
      showSuccessToast: true,
      successMessage: 'Challenge created successfully!',
      onSuccess: () => {
        setNewChallenge({ title: "", description: "", target_amount: "", is_public: true });
        setShowCreateForm(false);
        refetchChallenges();
      },
    }
  );

  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    target_amount: "",
    is_public: true,
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reportingId, setReportingId] = useState(null);
  const [reason, setReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
  const [enrolledChallengeIds, setEnrolledChallengeIds] = useState([]);
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);
  const mainContainerRef = useRef(null);

  // Scroll to top when pagination occurs
  useEffect(() => {
    if (shouldScrollToTop && mainContainerRef.current) {
      mainContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShouldScrollToTop(false);
    }
  }, [challenges, shouldScrollToTop]);

  useEffect(() => {
    refetchChallenges();
    if (token) {
      fetchEnrolledChallengeIds();
    }
  }, []);

  const fetchEnrolledChallengeIds = async () => {
    try {
      const response = await challengesService.getEnrolledChallenges(token);
      const ids = response.results.map((entry) => entry.challenge);
      setEnrolledChallengeIds(ids);
    } catch (err) {
      console.error("Error fetching enrolled challenges:", err);
    }
  };

  // Pagination handlers
  const handleNextPage = async () => {
    if (challengesResponse?.next) {
      try {
        const data = await challengesService.getChallengesFromUrl(challengesResponse.next, token);
        setChallengesResponse(data);
        setShouldScrollToTop(true);
      } catch (error) {
        showToast(t('common.error', 'An error occurred'), "error");
      }
    }
  };

  const handlePreviousPage = async () => {
    if (challengesResponse?.previous) {
      try {
        const data = await challengesService.getChallengesFromUrl(challengesResponse.previous, token);
        setChallengesResponse(data);
        setShouldScrollToTop(true);
      } catch (error) {
        showToast(t('common.error', 'An error occurred'), "error");
      }
    }
  };

  const handleCreateChallenge = async () => {
    const { title, description, target_amount, is_public } = newChallenge;

    if (!title.trim() || !description.trim() || !target_amount) {
      showToast(t('challenges.allFieldsRequired', 'All fields except visibility are required.'), "error");
      return;
    }

    try {
      await createChallenge({
        title: title.trim(),
        description: description.trim(),
        target_amount: parseFloat(target_amount),
        is_public: Boolean(is_public),
      });
    } catch (err) {
      console.error("Error creating challenge:", err);
    }
  };

  const handleEnroll = async (challengeId) => {
    try {
      await challengesService.enrollInChallenge(challengeId, token);
      await refetchChallenges();
      await fetchEnrolledChallengeIds();
      showToast(t('challenges.joinedChallenge', 'You joined the challenge!'), "success");
    } catch (err) {
      if (err.response?.status === 400) {
        showToast(t('challenges.alreadyParticipating', 'You are already participating or not allowed.'), "error");
      } else {
        showToast(t('challenges.errorJoining', 'Error joining challenge'), "error");
      }
    }
  };

  const handleReport = async () => {
    if (!reason.trim() || !reportDescription.trim()) {
      showToast(t('challenges.provideReasonDescription', 'Please provide both reason and description'), "error");
      return;
    }

    try {
      await challengesService.reportChallenge(reportingId, reason, reportDescription, token);
      showToast(t('challenges.reportedSuccess', 'Challenge reported successfully'), "success");
      closeModals();
    } catch (err) {
      showToast(t('challenges.errorReporting', 'Error reporting challenge'), "error");
    }
  };

  const closeModals = () => {
    setReportingId(null);
    setReason("");
    setReportDescription("");
  };

  return (
    <Navbar active="challenges">
      <motion.main
        ref={mainContainerRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: currentTheme.text }}
          >
            {t('challenges.title', 'Challenges')}
          </h1>
          <div className="flex flex-wrap gap-3">
            {token && (
              <button
                onClick={() => setShowEnrolledOnly((prev) => !prev)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:opacity-80"
                style={{
                  borderColor: currentTheme.border,
                  color: currentTheme.text,
                  backgroundColor: showEnrolledOnly ? currentTheme.primary + '15' : 'transparent'
                }}
              >
                {showEnrolledOnly ? t('challenges.showAll', 'Show All') : t('challenges.showEnrolled', 'Show Enrolled Only')}
              </button>
            )}
            <button
              onClick={() => setShowCreateForm(true)}
              className="rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90"
              style={{
                backgroundColor: currentTheme.secondary,
                color: currentTheme.background
              }}
            >
              {t('challenges.createChallenge', 'Create Challenge')}
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg opacity-70" style={{ color: currentTheme.text }}>
              {t('challenges.loadingChallenges', 'Loading challenges...')}
            </div>
          </div>
        ) : challenges.filter((c) => !showEnrolledOnly || enrolledChallengeIds.includes(c.id)).length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg opacity-70" style={{ color: currentTheme.text }}>
              {showEnrolledOnly ? t('challenges.noEnrolledChallenges', 'No enrolled challenges yet.') : t('challenges.noChallenges', 'No challenges yet. Be the first to create one!')}
            </div>
          </div>
        ) : (
          <section className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {challenges
              .filter((c) => !showEnrolledOnly || enrolledChallengeIds.includes(c.id))
              .map((challenge, index) => {
                const pct = Math.min(100, (challenge.current_progress / challenge.target_amount) * 100);
                const completed = pct >= 100;

                return (
                  <motion.article
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative flex flex-col rounded-xl border shadow-md hover:shadow-lg transition-shadow duration-300"
                    style={{
                      backgroundColor: currentTheme.background,
                      borderColor: currentTheme.border
                    }}
                  >
                    {/* Report button */}
                    <button
                      onClick={() => setReportingId(challenge.id)}
                      className="absolute top-2 z-10 rounded-lg p-1.5 backdrop-blur-sm transition-opacity hover:opacity-100 opacity-60"
                      style={{
                        backgroundColor: currentTheme.background + 'E6',
                        border: `1px solid ${currentTheme.border}`,
                        ...(isRTL ? { left: '0.5rem' } : { right: '0.5rem' })
                      }}
                      title={t('common.report', 'Report this challenge')}
                    >
                      <span className="text-sm">⚠️</span>
                    </button>

                    {/* Content container */}
                    <div className="flex flex-col flex-1 p-4">
                      {enrolledChallengeIds.includes(challenge.id) && (
                        <span
                          className="mb-2 inline-block w-fit rounded-full px-3 py-1 text-xs font-medium border"
                          style={{
                            backgroundColor: currentTheme.secondary,
                            color: currentTheme.background,
                            borderColor: currentTheme.secondary
                          }}
                        >
                          {t('challenges.youreEnrolled', "You're enrolled")}
                        </span>
                      )}
                      <h3
                        className="text-lg font-bold mb-2 pr-6"
                        style={{ color: currentTheme.text }}
                      >
                        {challenge.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed break-words mb-3"
                        style={{ color: currentTheme.text, opacity: 0.85 }}
                      >
                        {challenge.description}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-auto mb-3">
                        <div className="flex justify-between text-xs mb-1" style={{ color: currentTheme.text, opacity: 0.7 }}>
                          <span>{t('challenges.progress', 'Progress')}</span>
                          <span>{Math.round(pct)}%</span>
                        </div>
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ backgroundColor: currentTheme.border }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              backgroundColor: currentTheme.secondary
                            }}
                            className="h-full transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div
                      className="flex items-center justify-between border-t px-4 py-2 mt-auto"
                      style={{ borderColor: currentTheme.border }}
                    >
                      <span className="text-sm font-medium" style={{ color: currentTheme.text }}>
                        {parseFloat(challenge.current_progress).toFixed(2)}/{parseFloat(challenge.target_amount).toFixed(2)}
                      </span>
                      {token && (
                        <button
                          onClick={() => handleEnroll(challenge.id)}
                          disabled={enrolledChallengeIds.includes(challenge.id)}
                          className="rounded-lg px-3 py-1 text-sm font-medium transition-all hover:opacity-80 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: enrolledChallengeIds.includes(challenge.id) ? currentTheme.secondary : currentTheme.secondary,
                            color: enrolledChallengeIds.includes(challenge.id) ? currentTheme.background : currentTheme.background,
                            opacity: enrolledChallengeIds.includes(challenge.id) ? 0.6 : 1
                          }}
                        >
                          {enrolledChallengeIds.includes(challenge.id) ? t('challenges.alreadyJoined', 'Already Joined') : t('challenges.joinChallenge', 'Join Challenge')}
                        </button>
                      )}
                    </div>
                  </motion.article>
                );
              })}
          </section>
        )}

        {/* Pagination Controls */}
        {!isLoading && challenges.length > 0 && (challengesResponse?.next || challengesResponse?.previous) && (
          <div className="flex justify-center items-center gap-4 mt-8 mb-4">
            <button
              onClick={handlePreviousPage}
              disabled={!challengesResponse?.previous}
              className="px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
              style={{
                backgroundColor: challengesResponse?.previous ? currentTheme.secondary : currentTheme.border,
                color: challengesResponse?.previous ? '#fff' : currentTheme.text
              }}
            >
              ← {t('common.previous', 'Previous')}
            </button>
            <span className="text-sm opacity-70" style={{ color: currentTheme.text }}>
              {challengesResponse?.count ? `${challenges.length} of ${challengesResponse.count}` : ''}
            </span>
            <button
              onClick={handleNextPage}
              disabled={!challengesResponse?.next}
              className="px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
              style={{
                backgroundColor: challengesResponse?.next ? currentTheme.secondary : currentTheme.border,
                color: challengesResponse?.next ? '#fff' : currentTheme.text
              }}
            >
              {t('common.next', 'Next')} →
            </button>
          </div>
        )}

        {/* Create Challenge Modal */}
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
                  {t('challenges.createChallenge', 'Create Challenge')}
                </h2>
                <p className="text-sm mb-4" style={{ color: currentTheme.text, opacity: 0.7 }}>
                  {t('challenges.fillFields', 'Fill out the fields below to add a new sustainability challenge.')}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>
                      {t('challenges.inputTitle', 'Title')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('challenges.titlePlaceholder', 'Enter challenge title')}
                      value={newChallenge.title}
                      onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        backgroundColor: currentTheme.background,
                        borderColor: currentTheme.border,
                        color: currentTheme.text
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>
                      {t('challenges.description', 'Description')}
                    </label>
                    <textarea
                      rows={4}
                      placeholder={t('challenges.descriptionPlaceholder', 'Enter challenge description')}
                      value={newChallenge.description}
                      onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        backgroundColor: currentTheme.background,
                        borderColor: currentTheme.border,
                        color: currentTheme.text
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>
                      {t('challenges.targetAmount', 'Target Amount')}
                    </label>
                    <input
                      type="number"
                      placeholder={t('challenges.targetAmountPlaceholder', 'Enter target amount')}
                      value={newChallenge.target_amount}
                      onChange={(e) => setNewChallenge({ ...newChallenge, target_amount: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        backgroundColor: currentTheme.background,
                        borderColor: currentTheme.border,
                        color: currentTheme.text
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={newChallenge.is_public}
                      onChange={(e) => setNewChallenge({ ...newChallenge, is_public: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="is_public" className="text-sm" style={{ color: currentTheme.text }}>
                      {t('challenges.makePublic', 'Make challenge public')}
                    </label>
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
                    onClick={handleCreateChallenge}
                    disabled={isCreating}
                    className="rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: currentTheme.secondary,
                      color: currentTheme.background
                    }}
                  >
                    {isCreating ? t('common.creating', 'Creating...') : t('common.create', 'Create')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Modal */}
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
                className="w-full max-w-md rounded-lg border p-6"
                style={{
                  backgroundColor: currentTheme.background,
                  borderColor: currentTheme.border
                }}
              >
                <h2 className="text-lg font-semibold mb-2" style={{ color: currentTheme.text }}>
                  {t('challenges.reportChallenge', 'Report Challenge')}
                </h2>
                <p className="text-sm mb-4" style={{ color: currentTheme.text, opacity: 0.7 }}>
                  {t('challenges.reportDescription', "Let us know what's wrong with this challenge.")}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>
                      {t('challenges.reason', 'Reason')}
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        backgroundColor: currentTheme.background,
                        borderColor: currentTheme.border,
                        color: currentTheme.text
                      }}
                    >
                      <option value="">{t('challenges.selectReason', 'Select a reason')}</option>
                      <option value="SPAM">{t('challenges.spam', 'Spam')}</option>
                      <option value="INAPPROPRIATE">{t('challenges.inappropriate', 'Inappropriate')}</option>
                      <option value="HARASSMENT">{t('challenges.harassment', 'Harassment')}</option>
                      <option value="MISLEADING">{t('challenges.misleading', 'Misleading or Fake')}</option>
                      <option value="OTHER">{t('challenges.other', 'Other')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>
                      {t('challenges.description', 'Description')}
                    </label>
                    <textarea
                      rows={4}
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder={t('challenges.explainBriefly', 'Please explain briefly…')}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        backgroundColor: currentTheme.background,
                        borderColor: currentTheme.border,
                        color: currentTheme.text
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={closeModals}
                    className="rounded-lg border px-4 py-2 text-sm hover:opacity-80"
                    style={{
                      borderColor: currentTheme.border,
                      color: currentTheme.text
                    }}
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    onClick={handleReport}
                    disabled={!reason || !reportDescription.trim()}
                    className="rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: currentTheme.secondary,
                      color: currentTheme.background
                    }}
                  >
                    {t('common.submit', 'Submit')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
    </Navbar>
  );
}
