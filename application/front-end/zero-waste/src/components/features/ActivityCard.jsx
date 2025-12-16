import React from "react";
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";

/**
 * ActivityCard (Admin Version)
 * -----------
 * Displays an ActivityStreams 2.0 event with full technical details
 * Props:
 *  • activity: object (ActivityStreams 2.0 format)
 */

const getActivityTypeColorClass = (type) => {
  const typeColors = {
    Create: "bg-green-100 text-green-800",
    Update: "bg-blue-100 text-blue-800",
    Delete: "bg-red-100 text-red-800",
    Follow: "bg-indigo-100 text-indigo-800",
    Like: "bg-yellow-100 text-yellow-800",
    Announce: "bg-gray-100 text-gray-800",
  };
  return typeColors[type] || "bg-gray-100 text-gray-800";
};

const getVisibilityBadgeClass = (visibility) => {
  const badges = {
    PUBLIC: { className: "bg-green-100 text-green-800", text: "Public" },
    UNLISTED: { className: "bg-blue-100 text-blue-800", text: "Unlisted" },
    FOLLOWERS: {
      className: "bg-yellow-100 text-yellow-800",
      text: "Followers",
    },
    DIRECT: { className: "bg-gray-100 text-gray-800", text: "Direct" },
  };
  return (
    badges[visibility] || {
      className: "bg-gray-100 text-gray-800",
      text: visibility,
    }
  );
};

export default function ActivityCard({ activity }) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const visibilityBadge = getVisibilityBadgeClass(activity.visibility);
  const typeColorClass = getActivityTypeColorClass(activity.type);

  // Format date
  const formattedDate = activity.published_at
    ? new Date(activity.published_at).toLocaleString()
    : "Unknown date";

  // Helper to get translated activity type label
  const getActivityLabel = (act) => {
    const objectType = act.object_type || act.as2_json?.object?.type;
    const type = act.type; // Create, Update, etc.
    // as2_json.type might be "Create" but we have "Create Waste" which is specific.

    // Map combination to translation key
    // Keys from en.json: createWaste, updateWaste, deleteWaste, createPost, updatePost, etc.

    // Check Waste
    if (objectType === "UserWaste") {
      if (type === "Create") return t('activities.activityTypes.createWaste', 'Create Waste');
      // Add other waste types if needed
    }

    // Check Post (Note)
    if (objectType === "Note") {
      if (type === "Create") return t('activities.activityTypes.createPost', 'Create Post');
      // Update/Delete post logic might vary if backend sends them differently
    }

    // Check Comment
    if (objectType === "Comment") {
      if (type === "Create") return t('activities.activityTypes.createComment', 'Create Comment');
      if (type === "Update") return t('activities.activityTypes.updateComment', 'Update Comment');
    }

    // Check Like
    if (type === "Like") return t('activities.activityTypes.likePost', 'Like Post');

    // Check Follow
    if (type === "Follow") {
      // Could be Follow or Unfollow (Undo Follow) - simplified for now
      return t('activities.activityTypes.followUser', 'Follow User');
    }

    // For Unfollow, the type is actually "Undo" usually, wrapped around Follow?
    // If backend sends "Unfollow" type in our custom API, handle it.
    // But typically ActivityPub uses Undo -> Follow.
    // The previous frontend filter used 'unfollow-user' check which logic was: objectType === "Follow" && as2Type === "Undo"
    // Let's check if 'activity.type' is mapped from our backed. It seems backend sends "Follow" or maybe "Undo"?
    // If we can't match, return raw type.

    return act.type;
  };

  return (
    <div
      className="rounded-lg shadow-sm border mb-3 w-full max-w-4xl p-4"
      style={{
        backgroundColor: currentTheme.background,
        borderColor: currentTheme.border,
      }}
    >
      <div className="flex flex-col">
        {/* Header: Type and Visibility */}
        <div className="flex flex-wrap gap-2 mb-2">
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${typeColorClass}`}
          >
            {getActivityLabel(activity)}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${visibilityBadge.className}`}
          >
            {visibilityBadge.text}
          </span>
          {activity.community_id && (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800">
              Community: {activity.community_id}
            </span>
          )}
        </div>

        {/* Summary */}
        {activity.summary && (
          <div
            className="font-semibold mb-2"
            style={{ color: currentTheme.text }}
          >
            {activity.summary}
          </div>
        )}

        {/* Actor and Object info */}
        <div
          className="text-sm opacity-80"
          style={{ color: currentTheme.text }}
        >
          <div className="mb-1">
            <strong className="font-semibold">Actor:</strong>{" "}
            <code
              className="rounded px-1"
              style={{
                backgroundColor: currentTheme.hover,
                color: currentTheme.text,
              }}
            >
              {activity.actor_id || activity.as2_json?.actor || "N/A"}
            </code>
          </div>
          <div className="mb-1">
            <strong className="font-semibold">Object:</strong>{" "}
            <code
              className="rounded px-1"
              style={{
                backgroundColor: currentTheme.hover,
                color: currentTheme.text,
              }}
            >
              {activity.object_type || activity.as2_json?.object?.type || "N/A"}{" "}
              # {activity.object_id || activity.as2_json?.object?.id || "N/A"}
            </code>
          </div>
          <div className="mb-1">
            <strong className="font-semibold">Published:</strong>{" "}
            {formattedDate}
          </div>
          <div>
            <strong className="font-semibold">Event ID:</strong> {activity.id}
          </div>
        </div>

        {/* AS2 JSON preview (optional, for debugging) */}
        {activity.as2_json && Object.keys(activity.as2_json).length > 0 && (
          <details className="mt-3 group">
            <summary
              className="text-xs opacity-60 cursor-pointer hover:opacity-100"
              style={{ color: currentTheme.text }}
            >
              View AS2 JSON
            </summary>
            <pre
              className="p-3 rounded mt-2 text-xs overflow-auto max-h-[200px]"
              style={{
                backgroundColor: currentTheme.hover,
                color: currentTheme.text,
              }}
            >
              {JSON.stringify(activity.as2_json, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
