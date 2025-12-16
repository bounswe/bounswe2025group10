import React, { useState, useEffect } from "react";
import CommentCard from "../../components/features/CommentCard";
import adminService from "../../services/adminService";
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";
import { showToast } from "../../utils/toast";

function CommentPanel() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  // State Management
  const [comments, setComments] = useState([]); // These are Report objects containing comment content
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Fetch Reports (Type = 'comment')
  const fetchReports = async (page) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch reports specifically for 'comment' type
      const response = await adminService.getReports(page, "comment");
      const data = response.data;

      // Standard DRF Pagination: { count: N, next: url, previous: url, results: [] }
      setComments(data.results || []);
      setTotalCount(data.count || 0);
      setHasNext(!!data.next);
      setHasPrevious(!!data.previous);
    } catch (err) {
      console.error("Failed to fetch comment reports:", err);
      setError(t('admin.failedToLoad', "Failed to load items."));
    } finally {
      setLoading(false);
    }
  };

  // Initial Load & Page Changes
  useEffect(() => {
    fetchReports(currentPage);
  }, [currentPage]);

  // Handle Moderation Action (Delete Comment)
  const handleDelete = async (reportId) => {
    if (!window.confirm(t('admin.confirmDeleteComment', 'Are you sure you want to delete this comment?'))) return;

    try {
      // Backend expects "delete_media" action
      await adminService.moderateReport(reportId, "delete_media");
      showToast(t('common.saved', "Action completed successfully"), "success");
      
      // Refresh list after deletion
      fetchReports(currentPage);
    } catch (e) {
      console.error("Delete failed:", e);
      showToast(t('admin.deleteCommentFailed', "Failed to delete comment."), "error");
    }
  };

  // Pagination Handlers
  const handleNextPage = () => {
    if (hasNext) setCurrentPage((prev) => prev + 1);
  };

  const handlePreviousPage = () => {
    if (hasPrevious) setCurrentPage((prev) => prev - 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6" style={{ color: currentTheme.text }}>
      <header className="mb-6 border-b pb-4" style={{ borderColor: currentTheme.border }}>
        <h1 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
          {t('admin.commentModeration', 'Comment Moderation')}
        </h1>
        <p className="mt-2 text-sm opacity-70">
          {t('admin.manageComments', 'Review and manage reported comments.')}
        </p>
      </header>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Loading spinner */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.secondary }}></div>
        </div>
      ) : (
        <>
          {/* Comments list */}
          <div className="flex flex-col items-center gap-6">
            {comments.length === 0 ? (
              <div className="p-8 text-center opacity-70 bg-gray-50 rounded-lg w-full border" 
                   style={{ backgroundColor: currentTheme.hover, borderColor: currentTheme.border }}>
                {t('admin.noComments', 'No reported comments found.')}
              </div>
            ) : (
              comments.map((report) => {
                // The report object contains the nested content object (the comment)
                const commentContent = report.content || {};

                return (
                  <CommentCard
                    key={report.id}
                    commentId={report.id} // Pass Report ID for deletion action
                    // Map CommentPreviewSerializer fields to props
                    username={commentContent.author_id || "Unknown"}
                    content={commentContent.content || t('common.noContent', "No content")}
                    // Map Report fields
                    reason={report.reason}
                    description={report.description}
                    onDelete={() => handleDelete(report.id)}
                  />
                );
              })
            )}
          </div>

          {/* Pagination controls */}
          {comments.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={handlePreviousPage}
                disabled={!hasPrevious}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${!hasPrevious ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                style={{ backgroundColor: currentTheme.secondary, color: '#fff' }}
              >
                {t('common.previous', 'Previous')}
              </button>
              
              <span className="font-bold opacity-80">
                {t('common.page', 'Page')} {currentPage}
              </span>
              
              <button
                onClick={handleNextPage}
                disabled={!hasNext}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${!hasNext ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                style={{ backgroundColor: currentTheme.secondary, color: '#fff' }}
              >
                {t('common.next', 'Next')}
              </button>
            </div>
          )}

          {totalCount > 0 && (
             <div className="text-center mt-4 text-xs opacity-50 uppercase tracking-wider">
               {t('common.total', 'Total')}: {totalCount}
             </div>
          )}
        </>
      )}
    </div>
  );
}

export default CommentPanel;