import React, { useState, useEffect } from "react";
import ActivityCard from "../../components/features/ActivityCard";
import adminService from "../../services/adminService";
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";

function ActivityPanel() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterActor, setFilterActor] = useState("");

  const getActivities = async (page = 1) => {
    setLoading(true);
    setError(null);
    const itemsPerPage = 15;

    try {
      const filters = {};
      if (filterType) filters.type = filterType;
      if (filterActor) filters.actor_id = filterActor;

      const response = await adminService.getActivityEvents(page, filters);
      const data = response.data;

      // ActivityStreams 2.0 format response
      setActivities(data.items || []);
      setTotalItems(data.totalItems || 0);

      // Check if there are more pages
      setHasNext(data.totalItems > page * itemsPerPage);
      setHasPrevious(page > 1);
    } catch (error) {
      console.error("Failed to fetch activity events:", error);
      setError(t('admin.failedToLoadActivities', "Failed to load activity events. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getActivities(currentPage);
  }, [currentPage, filterType, filterActor]); // Reloads when filters change

  const handleClearFilters = () => {
    setFilterType("");
    setFilterActor("");
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (hasPrevious) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6" style={{ color: currentTheme.text }}>
      <header className="mb-6 border-b pb-4" style={{ borderColor: currentTheme.border }}>
        <h1 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
          {t('admin.activities', 'Activity Log')}
        </h1>
        <p className="mt-2 text-sm opacity-70">
          {t('admin.viewActivities', 'View system-wide activity events (ActivityPub).')}
        </p>
      </header>

      {/* Filters */}
      <div
        className="mb-6 p-4 rounded-lg border"
        style={{
          backgroundColor: currentTheme.hover,
          borderColor: currentTheme.border
        }}
      >
        <h5 className="font-semibold mb-3" style={{ color: currentTheme.primaryText }}>{t('common.filters', 'Filters')}</h5>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">{t('admin.filterType', 'Type')}</label>
            <select
              className="w-full rounded-md border p-2 focus:ring-2 focus:ring-green-500"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                borderColor: currentTheme.border
              }}
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">{t('admin.allTypes', 'All Types')}</option>
              <option value="Create">Create</option>
              <option value="Update">Update</option>
              <option value="Delete">Delete</option>
              <option value="Follow">Follow</option>
              <option value="Like">Like</option>
              <option value="Announce">Announce</option>
              <option value="Accept">Accept</option>
              <option value="Reject">Reject</option>
            </select>
          </div>

          {/* Actor Filter */}
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">{t('admin.filterActorID', 'Actor ID')}</label>
            <input
              type="text"
              className="w-full rounded-md border p-2 focus:ring-2 focus:ring-green-500"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                borderColor: currentTheme.border
              }}
              placeholder={t('admin.enterActorID', 'Enter actor ID...')}
              value={filterActor}
              onChange={(e) => setFilterActor(e.target.value)}
            />
          </div>

          {/* Clear Button */}
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 rounded-md border transition-colors hover:opacity-80 font-medium"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                borderColor: currentTheme.border
              }}
            >
              {t('admin.clearFilters', 'Clear Filters')}
            </button>
          </div>
        </div>
      </div>

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
          {/* Activities list */}
          <div className="flex flex-col items-center">
            {activities.length === 0 ? (
              <div className="p-8 text-center opacity-70 bg-gray-50 rounded-lg w-full" style={{ backgroundColor: currentTheme.hover }}>
                {t('admin.noActivities', 'No activity events found.')}
              </div>
            ) : (
              activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                />
              ))
            )}
          </div>

          {/* Pagination controls */}
          {activities.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={handlePreviousPage}
                disabled={!hasPrevious}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${!hasPrevious ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                style={{ backgroundColor: currentTheme.secondary, color: '#fff' }}
              >
                {t('common.previous', 'Previous')}
              </button>
              <span className="font-bold">
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

          <div className="text-center mt-4 text-sm opacity-60">
            {t('admin.totalEvents', 'Total Events')}: {totalItems}
          </div>
        </>
      )}
    </div>
  );
}

export default ActivityPanel;
