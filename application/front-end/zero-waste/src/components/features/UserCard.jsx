import React from "react";
import { useTheme } from "../../providers/ThemeContext";

/**
 * Props
 * -----
 * username          : string  – user handle / email
 * flaggedPosts      : number  – count of posts flagged for moderation
 * flaggedComments   : number  – count of comments flagged for moderation
 * onDelete          : function(user)  – callback when delete is clicked
 */
export default function UserCard({
  username,
  flaggedPosts,
  flaggedComments,
  onDelete,
}) {
  const { currentTheme } = useTheme();
  // Ensure undefined values are safely treated as zero
  const safeFlaggedPosts = flaggedPosts ?? 0;
  const safeFlaggedComments = flaggedComments ?? 0;

  return (
    <div
      className="rounded-lg shadow-sm border mb-3 w-full max-w-lg p-4"
      style={{
        backgroundColor: currentTheme.background,
        borderColor: currentTheme.border,
        color: currentTheme.text
      }}
    >
      <div className="flex items-center justify-between">
        {/* User name */}
        <div className="flex-1">
          <h5 className="font-bold text-lg mb-1" style={{ color: currentTheme.primaryText }}>
            User id: {username}
          </h5>

          <div className="text-sm opacity-80 flex gap-4 mt-2">
            <span className="flex items-center gap-2">
              Flagged Posts:
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${safeFlaggedPosts ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                {safeFlaggedPosts}
              </span>
            </span>

            <span className="flex items-center gap-2">
              Flagged Comments:
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${safeFlaggedComments ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                {safeFlaggedComments}
              </span>
            </span>
          </div>
        </div>

        {/* Delete */}
        <div className="ml-4">
          <button
            onClick={() => onDelete && onDelete(username)}
            className="px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}