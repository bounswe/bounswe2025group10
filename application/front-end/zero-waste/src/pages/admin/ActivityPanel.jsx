import React, { useState, useEffect } from "react";
import ActivityCard from "../../components/features/ActivityCard";
import adminService from "../../services/adminService";
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";
import { showToast } from "../../utils/toast";

function ActivityPanel() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const itemsPerPage = 15;

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterActor, setFilterActor] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // New: Search by summary
  
  // Debounced filter values to prevent API spam
  const [debouncedFilters, setDebouncedFilters] = useState({ 
    type: "", 
    actor: "", 
    search: "" 
  });

  // 1. Debounce Effect: Update active filters after user stops typing for 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters({
        type: filterType,
        actor: filterActor,
        search: searchTerm
      });
      setCurrentPage(1); // Reset to page 1 on filter change
    }, 500);

    return () => clearTimeout(timer);
  }, [filterType, filterActor, searchTerm]);

  // 2. Fetch Data Effect: Triggers on Page change or Debounced Filter change
  useEffect(() => {
    getActivities(currentPage, debouncedFilters);
  }, [currentPage, debouncedFilters]);

  const getActivities = async (page, filters) => {
    setLoading(true);
    setError(null);

    try {
      // Prepare params for adminService
      const queryParams = {};
      if (filters.type) queryParams.type = filters.type;
      if (filters.actor) queryParams.actor_id = filters.actor;
      if (filters.search) queryParams.search = filters.search; // Supported by backend SearchFilter

      const response = await adminService.getActivityEvents(page, queryParams);
      
      // Backend returns ActivityStreams 2.0 format: { items: [], totalItems: N }
      const data = response.data;
      
      setActivities(data.items || []);
      setTotalItems(data.totalItems || 0);

      // Calculate pagination state
      setHasNext(data.totalItems > page * itemsPerPage);
      setHasPrevious(page > 1);
    } catch (err) {
      console.error("Failed to fetch activity events:", err);
      setError(t('admin.failedToLoadActivities', "Failed to load activity events."));
      showToast(t('common.error', "An error occurred"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilterType("");
    setFilterActor("");
    setSearchTerm("");
    setDebouncedFilters({ type: "", actor: "", search: "" });
    setCurrentPage(1);
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

      {/* Filters Section */}
      <div
        className="mb-6 p-4 rounded-lg border"
        style={{
          backgroundColor: currentTheme.hover,
          borderColor: currentTheme.border
        }}
      >
        <h5 className="font-semibold mb-3" style={{ color: currentTheme.primaryText }}>
          {t('common.filters', 'Filters')}
        </h5>
        
        <div className="grid gap-4 md:grid-cols-4">
          
          {/* Search Input (New) */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1 opacity-70">
              {t('common.search', 'Search')}
            </label>
            <input
              type="text"
              className="w-full rounded-md border p-2 focus:ring-2 focus:ring-green-500 transition-colors"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                borderColor: currentTheme.border
              }}
              placeholder={t('admin.searchSummary', 'Search summary...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filter (Updated options to match backend) */}
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">
              {t('admin.filterType', 'Type')}
            </label>
            <select
              className="w-full rounded-md border p-2 focus:ring-2 focus:ring-green-500"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                borderColor: currentTheme.border
              }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">{t('admin.allTypes', 'All Types')}</option>
              {/* Domain specific types from backend docs */}
              <option value="create-waste">Create Waste</option>
              <option value="create-post">Create Post</option>
              <option value="create-challenge">Create Challenge</option>
              <option value="create-tip">Create Tip</option>
              <option value="like-post">Like Post</option>
              <option value="join-challenge">Join Challenge</option>
              <option value="delete-comment">Delete Comment</option>
              {/* Fallback generic types */}
              <option value="Follow">Follow</option>
              <option value="Announce">Announce</option>
            </select>
          </div>

          {/* Actor Filter */}
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">
              {t('admin.filterActorID', 'Actor ID')}
            </label>
            <input
              type="text"
              className="w-full rounded-md border p-2 focus:ring-2 focus:ring-green-500"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                borderColor: currentTheme.border
              }}
              placeholder={t('admin.enterActorID', 'username...')}
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

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.secondary }}></div>
        </div>
      ) : (
        <>
          {/* List Content */}
          <div className="flex flex-col gap-4">
            {activities.length === 0 ? (
              <div className="p-8 text-center opacity-70 rounded-lg w-full border" 
                   style={{ backgroundColor: currentTheme.hover, borderColor: currentTheme.border }}>
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

          {/* Pagination Controls */}
          {activities.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage(prev => prev - 1)}
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
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!hasNext}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${!hasNext ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                style={{ backgroundColor: currentTheme.secondary, color: '#fff' }}
              >
                {t('common.next', 'Next')}
              </button>
            </div>
          )}

          <div className="text-center mt-4 text-xs opacity-50 uppercase tracking-wider">
            {t('admin.totalEvents', 'Total Events')}: {totalItems}
          </div>
        </>
      )}
    </div>
  );
}

export default ActivityPanel;