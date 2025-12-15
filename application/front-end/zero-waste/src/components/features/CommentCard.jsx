import React from "react";
import { useTheme } from "../../providers/ThemeContext";

/**
 * CommentCard
 * -----------
 * Props
 *  • commentId   : number|string
 *  • username    : string
 *  • content     : string  (comment body)
 *  • reason      : string  (report reason)
 *  • description : string  (report description)
 *  • onDelete    : function(id)  – callback when Delete is clicked
 */

export default function CommentCard({
  commentId,
  username,
  content,
  reason,
  description,
  onDelete,
}) {
  const { currentTheme } = useTheme();

  return (
    <div
      className="rounded-lg shadow-md mb-4 border w-full max-w-2xl p-4"
      style={{
        backgroundColor: currentTheme.background,
        borderColor: currentTheme.border
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-semibold text-lg" style={{ color: currentTheme.primaryText }}>{username}</div>
          <div className="text-sm opacity-60 mb-2" style={{ color: currentTheme.text }}>Comment ID : {commentId}</div>
          <p className="mb-2" style={{ color: currentTheme.text }}>{content}</p>
          {(reason || description) && (
            <div className="mb-2 p-3 rounded bg-red-50 border border-red-100 mt-2 text-sm">
              {reason && (
                <div className="text-red-700">
                  <strong className="font-semibold">Report Reason:</strong> {reason}
                </div>
              )}
              {description && (
                <div className="text-red-600 mt-1">
                  <strong className="font-semibold">Description:</strong> {description}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="ml-4">
          <button
            onClick={() => onDelete && onDelete(commentId)}
            className="px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}