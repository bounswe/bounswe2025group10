import React, { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthContext";
import { useTheme } from "../providers/ThemeContext";
import { useLanguage } from "../providers/LanguageContext";
import UserActivityCard from "../components/features/ActivityCard";

function Activities() {
  const { username, token } = useAuth();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;

  // Filters
  const [filterType, setFilterType] = useState("");

  const activityTypes = [
    { value: "", label: t('activities.allTypes', 'All Types') },
    { value: "create-waste", label: t('activities.activityTypes.createWaste', 'Create Waste') },
    { value: "create-post", label: t('activities.activityTypes.createPost', 'Create Post') },
    { value: "create-comment", label: t('activities.activityTypes.createComment', 'Create Comment') },
    { value: "update-comment", label: t('activities.activityTypes.updateComment', 'Update Comment') },
    { value: "like-post", label: t('activities.activityTypes.likePost', 'Like Post') },
    { value: "follow-user", label: t('activities.activityTypes.followUser', 'Follow User') },
    { value: "unfollow-user", label: t('activities.activityTypes.unfollowUser', 'Unfollow User') },
  ];

  const getActivities = async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filterType) {
      params.append("type", filterType);
    }
    params.append("page_size", "100"); // Get more items for client-side pagination

    const queryString = params.toString();
    const url = `${import.meta.env.VITE_API_URL
      }/api/following-activity-events/${queryString ? `?${queryString}` : ""}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `HTTP error! status: ${response.status} - ${JSON.stringify(
            errorData
          )}`
        );
      }

      const data = await response.json();

      // ActivityStreams 2.0 OrderedCollection format
      if (data.items && Array.isArray(data.items)) {
        setActivities(data.items);
        setTotalItems(data.totalItems || data.items.length);
      } else {
        setActivities([]);
        setTotalItems(0);
      }
    } catch (err) {
      console.error("Failed to fetch activity events:", err);
      setError(err.message);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]); // Reload when filter changes

  const handleClearFilters = () => {
    setFilterType("");
    setCurrentPage(1);
  };

  // Client-side filtering and pagination
  // Only show specific activity types
  const allowedObjectTypes = [
    "UserWaste", // create-waste
    "Note", // create-post
    "Comment", // create-comment, update-comment
    "Like", // like-post
    "Follow", // follow-user, unfollow-user
  ];

  const filteredActivities = activities
    .filter((activity) => {
      const objectType =
        activity.object_type || activity.as2_json?.object?.type;
      return allowedObjectTypes.includes(objectType);
    })
    .filter((activity) => {
      if (!filterType) return true;

      // Map filterType to object types
      const objectType =
        activity.object_type || activity.as2_json?.object?.type;
      const as2Type = activity.as2_json?.type;

      if (filterType === "create-waste") return objectType === "UserWaste";
      if (filterType === "create-post")
        return objectType === "Note" && as2Type === "Create";
      if (filterType === "create-comment")
        return objectType === "Comment" && as2Type === "Create";
      if (filterType === "update-comment")
        return objectType === "Comment" && as2Type === "Update";
      if (filterType === "like-post") return objectType === "Like";
      if (filterType === "follow-user")
        return objectType === "Follow" && as2Type === "Follow";
      if (filterType === "unfollow-user")
        return objectType === "Follow" && as2Type === "Undo";

      return true;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActivities = filteredActivities.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div
      className="p-4 md:p-6 min-h-screen"
      style={{
        backgroundColor: currentTheme.background,
        color: currentTheme.text,
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <span className="mr-2">🌟</span>
          {t('activities.title', 'Activity Feed')}
        </h1>
        <p className="opacity-70 mb-1">
          {t('activities.subtitle', 'Your activities and activities from people you follow')}
        </p>
        <p className="opacity-70 text-sm">
          {filterType
            ? `${t('activities.totalEvents', 'Total events')}: ${filteredActivities.length}`
            : `${t('activities.totalEvents', 'Total events')}: ${totalItems}`}
        </p>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl border shadow-sm mb-6 p-4 md:p-6"
        style={{
          backgroundColor: currentTheme.background,
          borderColor: currentTheme.border,
        }}
      >
        <h2 className="text-lg font-semibold mb-4">{t('activities.filterType', 'Filters')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="activity-type-filter" className="block text-sm font-medium mb-1 opacity-90">
              {t('activities.filterType', 'Activity Type')}
            </label>
            <select
              id="activity-type-filter"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                borderColor: currentTheme.border,
              }}
            >
              {activityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              className="w-full rounded-lg border px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
              onClick={handleClearFilters}
              style={{
                borderColor: currentTheme.border,
                color: currentTheme.text,
              }}
            >
              {t('activities.clearFilters', 'Clear Filters')}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-100 border border-red-200 text-red-700">
          {t('common.errorLoading', 'Failed to load activity events. Please try again.')}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent"
            role="status"
            style={{ borderColor: currentTheme.secondary, borderTopColor: 'transparent' }} />
          <p className="mt-4 opacity-70">{t('common.loading', 'Loading activities...')}</p>
        </div>
      )}

      {/* Activities List */}
      {!loading && !error && (
        <>
          {currentActivities.length === 0 ? (
            <div className="text-center py-12 opacity-70">
              <p>{t('activities.noActivities', 'No activities found.')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentActivities.map((activity, index) => (
                <UserActivityCard key={activity.id || index} activity={activity} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                  }`}
                style={{
                  backgroundColor: currentTheme.secondary,
                  color: currentTheme.background,
                }}
              >
                {t('common.previous', 'Previous')}
              </button>

              <span className="text-sm font-medium px-4" style={{ color: currentTheme.text }}>
                {t('common.pageOf', `Page ${currentPage} of ${totalPages}`)}
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                  }`}
                style={{
                  backgroundColor: currentTheme.secondary,
                  color: currentTheme.background,
                }}
              >
                {t('common.next', 'Next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Activities;
