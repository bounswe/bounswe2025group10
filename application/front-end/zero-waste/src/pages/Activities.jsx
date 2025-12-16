import React, { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthContext";
import { useTheme } from "../providers/ThemeContext";
import { useLanguage } from "../providers/LanguageContext";
import UserActivityCard from "../components/features/ActivityCard";

function Activities() {
  const { username, token } = useAuth();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  console.log("Activities - Username:", username);
  console.log("Activities - Token:", token ? "Present" : "Missing");
  console.log("Activities - API URL:", import.meta.env.VITE_API_URL);

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;

  // Filters
  const [filterType, setFilterType] = useState("");

  const activityTypes = [
    { value: "", label: "All Types" },
    { value: "create-waste", label: "Create Waste" },
    { value: "create-post", label: "Create Post" },
    { value: "create-comment", label: "Create Comment" },
    { value: "update-comment", label: "Update Comment" },
    { value: "like-post", label: "Like Post" },
    { value: "follow-user", label: "Follow User" },
    { value: "unfollow-user", label: "Unfollow User" },
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
    const url = `${
      import.meta.env.VITE_API_URL
    }/api/following-activity-events/${queryString ? `?${queryString}` : ""}`;

    console.log("Fetching activities from:", url);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Error response:", errorData);
        throw new Error(
          `HTTP error! status: ${response.status} - ${JSON.stringify(
            errorData
          )}`
        );
      }

      const data = await response.json();
      console.log("Activities data:", data);

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
      className="p-4"
      style={{
        backgroundColor: currentTheme.backgroundColor,
        color: currentTheme.textColor,
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div className="mb-4">
        <h1 className="display-6 mb-2">
          <span className="me-2">🌟</span>
          Activity Feed
        </h1>
        <p className="text-muted">
          Your activities and activities from people you follow
        </p>
        <p className="text-muted">
          {filterType
            ? `Showing ${filteredActivities.length} of ${totalItems} events`
            : `Total: ${totalItems} events`}
        </p>
      </div>

      {/* Filters */}
      <div
        className="card mb-4"
        style={{
          backgroundColor: currentTheme.cardBackground,
          borderColor: currentTheme.borderColor,
        }}
      >
        <div className="card-body">
          <h5 className="card-title mb-3">Filters</h5>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="activity-type-filter" className="form-label">
                Activity Type
              </label>
              <select
                id="activity-type-filter"
                className="form-select"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  backgroundColor: currentTheme.inputBackground,
                  color: currentTheme.textColor,
                  borderColor: currentTheme.borderColor,
                }}
              >
                {activityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          Failed to load activity events. Please try again.
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading activities...</p>
        </div>
      )}

      {/* Activities List */}
      {!loading && !error && (
        <>
          {currentActivities.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No activities found.</p>
            </div>
          ) : (
            <div className="row g-3">
              {currentActivities.map((activity, index) => (
                <div key={activity.id || index} className="col-12">
                  <UserActivityCard activity={activity} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Activity pagination" className="mt-4">
              <ul className="pagination justify-content-center">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    style={{
                      backgroundColor:
                        currentPage === 1
                          ? currentTheme.cardBackground
                          : currentTheme.buttonBackground,
                      color:
                        currentPage === 1
                          ? currentTheme.mutedText
                          : currentTheme.textColor,
                      borderColor: currentTheme.borderColor,
                    }}
                  >
                    Previous
                  </button>
                </li>
                <li className="page-item disabled">
                  <span
                    className="page-link"
                    style={{
                      backgroundColor: currentTheme.cardBackground,
                      color: currentTheme.textColor,
                      borderColor: currentTheme.borderColor,
                    }}
                  >
                    Page {currentPage} of {totalPages}
                  </span>
                </li>
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    style={{
                      backgroundColor:
                        currentPage === totalPages
                          ? currentTheme.cardBackground
                          : currentTheme.buttonBackground,
                      color:
                        currentPage === totalPages
                          ? currentTheme.mutedText
                          : currentTheme.textColor,
                      borderColor: currentTheme.borderColor,
                    }}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default Activities;
