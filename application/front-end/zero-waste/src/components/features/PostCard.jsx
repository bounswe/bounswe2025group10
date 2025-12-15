import React from "react";
import { useTheme } from "../../providers/ThemeContext";

const PostCard = ({ image, title, description, reportReason, reportDescription, onDelete }) => {
  const { currentTheme } = useTheme();

  return (
    <div
      className="rounded-lg shadow-md mb-6 overflow-hidden max-w-2xl w-full border"
      style={{
        backgroundColor: currentTheme.background,
        borderColor: currentTheme.border
      }}
    >
      {image && (
        <div className="h-64 overflow-hidden">
          <img
            src={image}
            alt="Post"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: currentTheme.primaryText }} // Was text-success, now primaryText for better theme adapt
        >
          {title}
        </h3>
        <p className="mb-4" style={{ color: currentTheme.text }}>
          {description}
        </p>

        {/* Report information */}
        {(reportReason || reportDescription) && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30">
            {reportReason && (
              <div className="mb-1 text-red-600 dark:text-red-400">
                <span className="font-bold">Report Reason:</span> {reportReason}
              </div>
            )}
            {reportDescription && (
              <div className="text-sm text-red-500 dark:text-red-300">
                <span className="font-bold">Details:</span> {reportDescription}
              </div>
            )}
          </div>
        )}

        {onDelete && (
          <button
            onClick={onDelete}
            className="px-4 py-2 rounded-lg text-white font-medium transition-colors hover:bg-red-600"
            style={{ backgroundColor: '#ef4444' }} // red-500
          >
            Delete Post
          </button>
        )}
      </div>
    </div>
  );
};

export default PostCard;