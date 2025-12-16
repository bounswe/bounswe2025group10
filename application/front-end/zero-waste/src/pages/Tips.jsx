import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../utils/toast";
import { useAuth } from "../providers/AuthContext";
import { useTheme } from "../providers/ThemeContext";
import { useLanguage } from "../providers/LanguageContext";
import { useApi } from "../hooks/useApi";
import { tipsService } from "../services/tipsService";

export default function Tips() {
  const { token } = useAuth();
  const { currentTheme } = useTheme();
  const { t, isRTL, language } = useLanguage();
  const [pageSize, setPageSize] = useState(12);

  const {
    data: tipsResponse,
    loading: isLoading,
    error,
    execute: refetchTips,
    setData: setTipsResponse,
  } = useApi(
    () => tipsService.getTips(token, language, pageSize),
    {
      initialData: { results: [] },
      showErrorToast: true,
      errorMessage: 'Failed to fetch tips',
    }
  );

  // Extract tips array from paginated response
  const tips = tipsResponse?.results || [];
  const setTips = (newTips) => {
    setTipsResponse({ ...tipsResponse, results: newTips });
  };

  const {
    loading: isCreating,
    execute: createTip,
  } = useApi(
    (tipData) => tipsService.createTip(tipData, token, language),
    {
      showSuccessToast: true,
      successMessage: 'Tip created successfully!',
      onSuccess: () => {
        setNewTip({ title: "", description: "" });
        setShowCreateForm(false);
        refetchTips();
      },
    }
  );

  const [newTip, setNewTip] = useState({ title: "", description: "" });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reportingId, setReportingId] = useState(null);
  const [reason, setReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [isPaginating, setIsPaginating] = useState(false);
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);
  const [processingTips, setProcessingTips] = useState(new Set());
  const mainContainerRef = useRef(null);

  // Scroll to top when pagination occurs
  useEffect(() => {
    if (shouldScrollToTop && mainContainerRef.current) {
      mainContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShouldScrollToTop(false);
    }
  }, [tips, shouldScrollToTop]);

  // Pagination handlers
  const handleNextPage = async () => {
    const nextUrl = tipsResponse?.pagination?.next || tipsResponse?.next;
    if (nextUrl) {
      setIsPaginating(true);
      try {
        const data = await tipsService.getTipsFromUrl(nextUrl, token, language, pageSize);
        setTipsResponse(data);
        setShouldScrollToTop(true);
      } catch (error) {
        showToast(t('common.error', 'An error occurred'), "error");
      } finally {
        setIsPaginating(false);
      }
    }
  };

  const handlePreviousPage = async () => {
    const prevUrl = tipsResponse?.pagination?.previous || tipsResponse?.previous;
    if (prevUrl) {
      setIsPaginating(true);
      try {
        const data = await tipsService.getTipsFromUrl(prevUrl, token, language, pageSize);
        setTipsResponse(data);
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
    const prevUrl = tipsResponse?.pagination?.previous || tipsResponse?.previous;
    const nextUrl = tipsResponse?.pagination?.next || tipsResponse?.next;

    if (prevUrl) {
      const urlObj = new URL(prevUrl, window.location.origin);
      const prevPage = parseInt(urlObj.searchParams.get('page') || '1');
      return prevPage + 1;
    } else if (nextUrl) {
      return 1;
    }
    return 1;
  };

  const getTotalPages = () => {
    const count = tipsResponse?.pagination?.count ?? tipsResponse?.count;
    if (count && pageSize) {
      return Math.ceil(count / pageSize);
    }
    return 1;
  };

  const handleLike = async (tipId) => {
    if (processingTips.has(tipId)) return;
    setProcessingTips(prev => new Set(prev).add(tipId));
    try {
      const tip = tips.find(t => t.id === tipId);
      const wasLiked = tip?.is_user_liked;

      await tipsService.likeTip(tipId, token);

      // Update local state
      setTips(tips.map(t => {
        if (t.id === tipId) {
          return {
            ...t,
            is_user_liked: !wasLiked,
            is_user_disliked: false,
            like_count: wasLiked ? t.like_count - 1 : t.like_count + 1,
            dislike_count: t.is_user_disliked ? t.dislike_count - 1 : t.dislike_count
          };
        }
        return t;
      }));

      showToast(wasLiked ? t('tips.unliked', 'Unliked') : t('tips.liked', 'Liked!'), "success");
    } catch (err) {
      showToast(t('tips.errorUpdatingLike', 'Error updating like'), "error");
    } finally {
      setProcessingTips(prev => {
        const newSet = new Set(prev);
        newSet.delete(tipId);
        return newSet;
      });
    }
  };


  const handleDislike = async (tipId) => {
    if (processingTips.has(tipId)) return;
    setProcessingTips(prev => new Set(prev).add(tipId));
    try {
      const tip = tips.find(t => t.id === tipId);
      const wasDisliked = tip?.is_user_disliked;

      await tipsService.dislikeTip(tipId, token);

      // Update local state
      setTips(tips.map(t => {
        if (t.id === tipId) {
          return {
            ...t,
            is_user_disliked: !wasDisliked,
            is_user_liked: false,
            dislike_count: wasDisliked ? t.dislike_count - 1 : t.dislike_count + 1,
            like_count: t.is_user_liked ? t.like_count - 1 : t.like_count
          };
        }
        return t;
      }));

      showToast(wasDisliked ? t('tips.undisliked', 'Undisliked') : t('tips.disliked', 'Disliked'), "success");
    } catch (err) {
      showToast(t('tips.errorUpdatingDislike', 'Error updating dislike'), "error");
    } finally {
      setProcessingTips(prev => {
        const newSet = new Set(prev);
        newSet.delete(tipId);
        return newSet;
      });
    }
  };

  const handleReport = async (tipId, reason, description) => {
    if (!reason.trim() || !description.trim()) {
      showToast(t('tips.provideReasonDescription', 'Please provide both reason and description'), "error");
      return;
    }
    try {
      await tipsService.reportTip(tipId, { reason, description }, token);
      showToast(t('tips.tipReportedSuccess', 'Tip reported successfully'), "success");
    } catch (err) {
      showToast(t('tips.errorReportingTip', 'Error reporting tip'), "error");
    }
  };

  const closeModals = () => {
    setReportingId(null);
    setReason("");
    setReportDescription("");
  };

  useEffect(() => {
    refetchTips();
  }, [language, pageSize]);

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
          {t('tips.title', 'Sustainability Tips')}
        </h1>
        <div className="flex items-center gap-3">
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
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90"
            style={{
              backgroundColor: currentTheme.secondary,
              color: currentTheme.background
            }}
          >
            {t('tips.createTip', 'Create Tip')}
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-lg opacity-70" style={{ color: currentTheme.text }}>
            {t('tips.loadingTips', 'Loading tips...')}
          </div>
        </div>
      ) : tips.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-lg opacity-70" style={{ color: currentTheme.text }}>
            {t('tips.noTips', 'No tips yet. Be the first to share!')}
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
            {tips.map((tip, index) => (
              <motion.article
                key={tip.id}
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
                  onClick={() => setReportingId(tip.id)}
                  className="absolute top-2 z-10 rounded-lg p-1.5 backdrop-blur-sm transition-opacity hover:opacity-100 opacity-60"
                  style={{
                    backgroundColor: currentTheme.background + 'E6',
                    border: `1px solid ${currentTheme.border}`,
                    ...(isRTL ? { left: '0.5rem' } : { right: '0.5rem' })
                  }}
                  title={t('common.report', 'Report this tip')}
                >
                  <span className="text-sm">⚠️</span>
                </button>

                {/* Content container */}
                <div className="flex flex-col flex-1 p-4">
                  <h3
                    className="text-lg font-bold mb-2 pr-6"
                    style={{ color: currentTheme.text }}
                  >
                    {tip.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed break-words flex-1"
                    style={{ color: currentTheme.text, opacity: 0.85 }}
                  >
                    {tip.description}
                  </p>
                </div>

                {/* Interaction buttons */}
                <div
                  className="flex items-center gap-2 border-t px-4 py-2 mt-auto"
                  style={{ borderColor: currentTheme.border }}
                >
                  <button
                    onClick={() => handleLike(tip.id)}
                    disabled={processingTips.has(tip.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all duration-150 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      backgroundColor: tip.is_user_liked ? currentTheme.secondary + '15' : 'transparent',
                      color: tip.is_user_liked ? currentTheme.secondary : currentTheme.text,
                      fontWeight: tip.is_user_liked ? '600' : '500'
                    }}
                  >
                    <span>👍</span>
                    <span className="text-sm">{tip.like_count}</span>
                  </button>

                  <button
                    onClick={() => handleDislike(tip.id)}
                    disabled={processingTips.has(tip.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all duration-150 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      backgroundColor: tip.is_user_disliked ? currentTheme.secondary + '15' : 'transparent',
                      color: tip.is_user_disliked ? currentTheme.secondary : currentTheme.text,
                      fontWeight: tip.is_user_disliked ? '600' : '500',
                      opacity: tip.is_user_disliked ? 1 : 0.7
                    }}
                  >
                    <span>👎</span>
                    <span className="text-sm">{tip.dislike_count}</span>
                  </button>
                </div>
              </motion.article>
            ))}
          </section>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && tips.length > 0 && (
        <div className="flex justify-center items-center gap-4 mt-8 mb-4">
          <button
            onClick={handlePreviousPage}
            disabled={!(tipsResponse?.pagination?.previous || tipsResponse?.previous) || isPaginating}
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
              {(tipsResponse?.pagination?.count || tipsResponse?.count) ? `Total: ${tipsResponse?.pagination?.count || tipsResponse?.count}` : ''}
            </span>
          </div>
          <button
            onClick={handleNextPage}
            disabled={!(tipsResponse?.pagination?.next || tipsResponse?.next) || isPaginating}
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

      {/* Create Tip Modal */}
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
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: currentTheme.text }}
              >
                {t('tips.createTip', 'Create Tip')}
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: currentTheme.text }}
                  >
                    {t('tips.title', 'Title')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('tips.titlePlaceholder', 'Enter tip title')}
                    value={newTip.title}
                    onChange={(e) => setNewTip({ ...newTip, title: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{
                      backgroundColor: currentTheme.background,
                      borderColor: currentTheme.border,
                      color: currentTheme.text
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: currentTheme.text }}
                  >
                    {t('tips.description', 'Description')}
                  </label>
                  <textarea
                    rows={4}
                    placeholder={t('tips.descriptionPlaceholder', 'Enter tip description')}
                    value={newTip.description}
                    onChange={(e) => setNewTip({ ...newTip, description: e.target.value })}
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
                  onClick={() => createTip(newTip)}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: currentTheme.text }}
              >
                {t('tips.reportTip', 'Report Tip')}
              </h2>
              <p
                className="text-sm mb-4"
                style={{ color: currentTheme.text, opacity: 0.7 }}
              >
                {t('tips.reportDescription', "Let us know what's wrong with this tip.")}
              </p>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: currentTheme.text }}
                  >
                    {t('tips.reason', 'Reason')}
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
                    <option value="">{t('tips.selectReason', 'Select a reason')}</option>
                    <option value="SPAM">{t('tips.spam', 'Spam')}</option>
                    <option value="INAPPROPRIATE">{t('tips.inappropriate', 'Inappropriate')}</option>
                    <option value="HARASSMENT">{t('tips.harassment', 'Harassment')}</option>
                    <option value="MISLEADING">{t('tips.misleading', 'Misleading or Fake')}</option>
                    <option value="OTHER">{t('tips.other', 'Other')}</option>
                  </select>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: currentTheme.text }}
                  >
                    {t('tips.description', 'Description')}
                  </label>
                  <textarea
                    rows={4}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder={t('tips.explainBriefly', 'Please explain briefly…')}
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
                  onClick={() => {
                    if (!reason || !reportDescription.trim()) return;
                    handleReport(reportingId, reason, reportDescription.trim());
                    closeModals();
                  }}
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