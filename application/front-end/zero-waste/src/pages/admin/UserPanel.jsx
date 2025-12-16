import React, { useState, useEffect } from "react";
import UserCard from "../../components/features/UserCard";
import adminService from "../../services/adminService";
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";
import { showToast } from "../../utils/toast";

function UserPanel() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  // State Management
  const [userReports, setUserReports] = useState([]); // List of reports about users
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Fetch Reports (Type = 'users')
  const fetchReports = async (page) => {
    setLoading(true);
    setError(null);
    try {
      // The model name for users is likely "users" or "user" based on your backend
      // We pass 'users' as it matches the previous hook usage.
      const response = await adminService.getReports(page, "users");
      const data = response.data;

      // Standard DRF Pagination: { count: N, next: url, previous: url, results: [] }
      setUserReports(data.results || []);
      setTotalCount(data.count || 0);
      setHasNext(!!data.next);
      setHasPrevious(!!data.previous);
    } catch (err) {
      console.error("Failed to fetch user reports:", err);
      // It's possible the content type is 'user' (singular). 
      // If 'users' fails 400, you might want to try 'user', but we stick to the provided code's convention.
      setError(t('admin.failedToLoad', "Failed to load items."));
    } finally {
      setLoading(false);
    }
  };

  // Initial Load & Page Changes
  useEffect(() => {
    fetchReports(currentPage);
  }, [currentPage]);

  // Handle Moderation Action (Ban User)
  const handleDelete = async (reportId) => {
    if (!window.confirm(t('admin.confirmBan', 'Are you sure you want to ban this user?'))) return;

    try {
      // Backend expects "ban_user" action
      await adminService.moderateReport(reportId, "ban_user");
      showToast(t('common.saved', "Action completed successfully"), "success");
      
      // Refresh list after banning
      fetchReports(currentPage);
    } catch (e) {
      console.error("Ban failed:", e);
      showToast(t('admin.banFailed', "Failed to ban user."), "error");
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
          {t('admin.userModeration', 'User Moderation')}
        </h1>
        <p className="mt-2 text-sm opacity-70">
          {t('admin.manageUsers', 'Review and manage reported users.')}
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
          {/* Users list */}
          <div className="flex flex-col items-center gap-6">
            {userReports.length === 0 ? (
              <div className="p-8 text-center opacity-70 bg-gray-50 rounded-lg w-full border" 
                   style={{ backgroundColor: currentTheme.hover, borderColor: currentTheme.border }}>
                {t('admin.noUsers', 'No reported users found.')}
              </div>
            ) : (
              userReports.map((report) => {
                // report.content is the User object (if supported by backend serializer)
                const userContent = report.content || {};
                
                // Fallback username logic
                const displayUsername = userContent.username 
                  || `User ID: ${report.object_id}`;

                return (
                  <UserCard
                    key={report.id}
                    // Mapping report details to UserCard props
                    username={displayUsername}
                    // Note: Backend ReportReadSerializer currently does not return flagged stats
                    // We default these to 0 or N/A until backend supports aggregation
                    flaggedPosts={0} 
                    flaggedComments={0}
                    // Reporting details
                    reportReason={report.reason}
                    // Action
                    onDelete={() => handleDelete(report.id)}
                  />
                );
              })
            )}
          </div>

          {/* Pagination controls */}
          {userReports.length > 0 && (
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

export default UserPanel;