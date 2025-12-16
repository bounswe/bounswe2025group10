import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { showToast } from "../utils/toast";
import { useAuth } from "../providers/AuthContext";
import { useTheme } from "../providers/ThemeContext";
import { useLanguage } from "../providers/LanguageContext";
import { useApi } from "../hooks/useApi";
import { challengesService } from "../services/challengesService";

export default function Challenges() {
  const { token } = useAuth();
  const { currentTheme } = useTheme();
  const { t, isRTL, language } = useLanguage();
  const [pageSize, setPageSize] = useState(21);

  const {
    data: challengesResponse,
    loading: isLoading,
    error,
    execute: refetchChallenges,
    setData: setChallengesResponse,
  } = useApi(
    () => challengesService.getChallenges(token, language, pageSize),
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
        setNewChallenge({ title: "", description: "", target_amount: "", is_public: true, deadline: "" });
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
    deadline: "",
  });
  const [unit, setUnit] = useState("g");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reportingId, setReportingId] = useState(null);
  const [reason, setReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
  const [enrolledChallengeIds, setEnrolledChallengeIds] = useState([]);
  const [enrolledDetails, setEnrolledDetails] = useState({});
  const [isPaginating, setIsPaginating] = useState(false);
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
  }, [language, pageSize]);

  const fetchEnrolledChallengeIds = async () => {
    try {
      const response = await challengesService.getEnrolledChallenges(token, language, pageSize);
      const ids = response.results.map((entry) => entry.challenge);
      const details = {};
      response.results.forEach((entry) => {
        details[entry.challenge] = { joined_date: entry.joined_date };
      });
      setEnrolledChallengeIds(ids);
      setEnrolledDetails(details);
    } catch (err) {
      console.error("Error fetching enrolled challenges:", err);
    }
  };

  // Pagination handlers
  const handleNextPage = async () => {
    if (challengesResponse?.next) {
      setIsPaginating(true);
      try {
        const data = await challengesService.getChallengesFromUrl(challengesResponse.next, token, language, pageSize);
        setChallengesResponse(data);
        setShouldScrollToTop(true);
      } catch (error) {
        showToast(t('common.error', 'An error occurred'), "error");
      } finally {
        setIsPaginating(false);
      }
    }
  };

  const handlePreviousPage = async () => {
    if (challengesResponse?.previous) {
      setIsPaginating(true);
      try {
        const data = await challengesService.getChallengesFromUrl(challengesResponse.previous, token, language, pageSize);
        setChallengesResponse(data);
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
    if (challengesResponse?.previous) {
      const prevUrl = new URL(challengesResponse.previous, window.location.origin);
      const prevPage = parseInt(prevUrl.searchParams.get('page') || '1');
      return prevPage + 1;
    } else if (challengesResponse?.next) {
      return 1;
    }
    return 1;
  };

  const getTotalPages = () => {
    if (challengesResponse?.count && pageSize) {
      return Math.ceil(challengesResponse.count / pageSize);
    }
    return 1;
  };

  const handleCreateChallenge = async () => {
    const { title, description, target_amount, is_public, deadline } = newChallenge;

    if (!title.trim() || !description.trim() || !target_amount || !deadline) {
      showToast(t('challenges.allFieldsRequired', 'All fields except visibility are required.'), "error");
      return;
    }

    try {
      // Automatic conversion: If user selects kg, convert to grams for backend storage
      const amountInGrams = unit === 'kg'
        ? parseFloat(target_amount) * 1000
        : parseFloat(target_amount);

      // Append unit info to description so user sees what they selected
      const fullDescription = `${description.trim()}\n\n[Display Unit: ${unit}]`;

      await createChallenge({
        title: title.trim(),
        description: fullDescription,
        target_amount: amountInGrams,
        is_public: Boolean(is_public),
        deadline: new Date(deadline).toISOString(),
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
            {challenges
              .filter((c) => !showEnrolledOnly || enrolledChallengeIds.includes(c.id))
              .map((challenge, index) => {
                const pct = Math.min(100, (challenge.current_progress / challenge.target_amount) * 100);
                const completed = pct >= 100;
                const isEnrolled = enrolledChallengeIds.includes(challenge.id);

                return (
                  <motion.article
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative flex flex-col rounded-xl border shadow-md hover:shadow-lg transition-all duration-300"
                    style={{
                      backgroundColor: isEnrolled
                        ? (currentTheme.theme === 'dark' ? currentTheme.secondary + '15' : currentTheme.secondary + '10')
                        : currentTheme.background,
                      borderColor: isEnrolled ? currentTheme.secondary : currentTheme.border,
                      borderWidth: isEnrolled ? '2px' : '1px',
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
                    <div className="flex flex-col flex-1 p-5">
                      {/* Header Section */}
                      <div className="mb-3">
                        {isEnrolled && (
                          <span
                            className="mb-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border"
                            style={{
                              backgroundColor: currentTheme.secondary,
                              color: currentTheme.background,
                              borderColor: currentTheme.secondary
                            }}
                          >
                            <span>✓</span> {t('challenges.youreEnrolled', "You're enrolled")}
                          </span>
                        )}
                        <h3
                          className="text-lg font-bold pr-8 leading-tight"
                          style={{ color: currentTheme.text }}
                        >
                          {challenge.title}
                        </h3>
                      </div>

                      <p
                        className="text-sm leading-relaxed break-words mb-4"
                        style={{ color: currentTheme.text, opacity: 0.85 }}
                      >
                        {challenge.description}
                      </p>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-xs">
                        {/* Joined Date */}
                        {isEnrolled && enrolledDetails[challenge.id] && (
                          <div
                            className="flex flex-col p-2 rounded-lg"
                            style={{ backgroundColor: currentTheme.background === '#ffffff' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}
                          >
                            <span className="opacity-60 font-medium mb-0.5">{t('challenges.joinedDate', 'Joined Date')}</span>
                            <span className="font-semibold" style={{ color: currentTheme.text }}>
                              {new Date(enrolledDetails[challenge.id].joined_date).toLocaleString()}
                            </span>
                          </div>
                        )}

                        {/* Deadline */}
                        {challenge.deadline && (
                          <div
                            className={`flex flex-col p-2 rounded-lg ${!isEnrolled ? 'col-span-2' : ''}`}
                            style={{ backgroundColor: currentTheme.background === '#ffffff' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}
                          >
                            <span className="opacity-60 font-medium mb-0.5">{t('challenges.deadline', 'Deadline')}</span>
                            <span className="font-semibold" style={{ color: currentTheme.text }}>
                              {new Date(challenge.deadline).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-auto mb-1">
                        <div className="flex justify-between text-xs mb-1" style={{ color: currentTheme.text, opacity: 0.8 }}>
                          <span className="font-medium">{t('challenges.progress', 'Progress')}</span>
                          <span className="font-bold">{Math.round(pct)}%</span>
                        </div>
                        <div
                          className="h-2.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700"
                          style={{ backgroundColor: currentTheme.border }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              backgroundColor: currentTheme.secondary
                            }}
                            className="h-full transition-all duration-500 ease-out"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div
                      className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 mt-auto"
                      style={{ borderColor: isEnrolled ? currentTheme.secondary + '40' : currentTheme.border }}
                    >
                      <span className="text-sm font-bold font-mono" style={{ color: currentTheme.text }}>
                        {parseFloat(challenge.current_progress).toFixed(1)} / {parseFloat(challenge.target_amount).toFixed(1)}
                      </span>
                      {token && (
                        <button
                          onClick={() => handleEnroll(challenge.id)}
                          disabled={isEnrolled}
                          className={`rounded-lg px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${isEnrolled ? 'cursor-default' : 'hover:opacity-90 hover:scale-105 transform'
                            }`}
                          style={{
                            backgroundColor: isEnrolled ? 'transparent' : currentTheme.secondary,
                            color: isEnrolled ? currentTheme.secondary : currentTheme.background,
                            border: isEnrolled ? `1px solid ${currentTheme.secondary}` : 'none',
                            opacity: isEnrolled ? 0.8 : 1
                          }}
                        >
                          {isEnrolled ? t('challenges.alreadyJoined', 'Already Joined') : t('challenges.joinChallenge', 'Join Challenge')}
                        </button>
                      )}
                    </div>
                  </motion.article>
                );
              })}
          </section>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && challenges.length > 0 && (
        <div className="flex justify-center items-center gap-4 mt-8 mb-4">
          <button
            onClick={handlePreviousPage}
            disabled={!challengesResponse?.previous || isPaginating}
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
              {challengesResponse?.count ? `Total: ${challengesResponse.count}` : ''}
            </span>
          </div>
          <button
            onClick={handleNextPage}
            disabled={!challengesResponse?.next || isPaginating}
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

                <div className="flex gap-4">
                  <div className="flex-1">
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
                  <div className="w-1/3">
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>
                      {t('challenges.unit', 'Unit')}
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        backgroundColor: currentTheme.background,
                        borderColor: currentTheme.border,
                        color: currentTheme.text
                      }}
                    >
                      <option value="g">{t('units.grams', 'grams')}</option>
                      <option value="kg">{t('units.kilograms', 'kilograms')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>
                    {t('challenges.deadline', 'Deadline')}
                  </label>
                  <DatePicker
                    selected={newChallenge.deadline ? new Date(newChallenge.deadline) : null}
                    onChange={(date) => setNewChallenge({ ...newChallenge, deadline: date ? date.toISOString() : "" })}
                    showTimeSelect
                    dateFormat="Pp"
                    minDate={new Date()}
                    placeholderText={t('challenges.selectDeadline', 'Select deadline')}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    wrapperClassName="w-full"
                    style={{
                      backgroundColor: currentTheme.background,
                      color: currentTheme.text,
                      borderColor: currentTheme.border
                    }}
                    customInput={
                      <input
                        style={{
                          backgroundColor: currentTheme.background,
                          color: currentTheme.text,
                          borderColor: currentTheme.border,
                          width: '100%'
                        }}
                      />
                    }
                  />
                  <style>{`
                    .react-datepicker {
                      font-family: inherit;
                      background-color: ${currentTheme.background};
                      border-color: ${currentTheme.border};
                      color: ${currentTheme.text};
                    }
                    .react-datepicker__header {
                      background-color: ${currentTheme.background === '#ffffff' ? '#f3f4f6' : '#1f2937'};
                      border-bottom-color: ${currentTheme.border};
                    }
                    .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker__day-name {
                      color: ${currentTheme.text};
                    }
                    .react-datepicker__day {
                      color: ${currentTheme.text};
                    }
                    .react-datepicker__day:hover {
                      background-color: ${currentTheme.secondary}33;
                    }
                    .react-datepicker__day--selected {
                      background-color: ${currentTheme.secondary} !important;
                      color: #fff !important;
                    }
                    .react-datepicker__time-container {
                      border-left-color: ${currentTheme.border};
                      background-color: ${currentTheme.background};
                    }
                    .react-datepicker__time-container .react-datepicker__time {
                      background-color: ${currentTheme.background};
                    }
                    .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item {
                      color: ${currentTheme.text};
                    }
                    .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
                      background-color: ${currentTheme.secondary}33;
                    }
                    .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
                      background-color: ${currentTheme.secondary} !important;
                      color: #fff !important;
                    }
                  `}</style>
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
  );
}
