import React from "react";
import { useTheme } from "../../providers/ThemeContext";

/**
 * Props
 * -----
 *  • challengeId   (number|string)
 *  • name          (string)
 *  • duration      (string | number)   // e.g. "30 days"
 *  • reason        (string)            // report reason
 *  • description   (string)            // report description
 *  • onDelete      (function)          // called on delete click
 */
export default function ChallengeCard({
  challengeId,
  name,
  duration,
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
          <h5 className="font-bold text-lg mb-1" style={{ color: currentTheme.primaryText }}>{name}</h5>
          <div className="text-sm opacity-70" style={{ color: currentTheme.text }}>
            <strong>ID :</strong> {challengeId}
          </div>
          <div className="text-sm opacity-70 mb-2" style={{ color: currentTheme.text }}>
            <strong>Challenge progress :</strong> {duration}
          </div>
          {(reason || description) && (
            <div className="mb-2 p-3 rounded bg-red-50 border border-red-100 mt-2">
              {reason && (
                <div className="text-red-600">
                  <strong className="font-semibold">Report Reason:</strong> {reason}
                </div>
              )}
              {description && (
                <div className="text-red-500 text-sm mt-1">
                  <strong className="font-semibold">Description:</strong> {description}
                </div>
              )}
            </div>
          )}
        </div>

        {onDelete && (
          <div className="ml-4">
            <button
              onClick={() => onDelete(challengeId)}
              className="px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}