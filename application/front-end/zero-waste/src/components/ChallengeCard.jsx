import React from "react";
import { Link } from "react-router-dom";

/**
 * @typedef {Object} Challenge
 * @property {string|number} id
 * @property {string} title
 * @property {string} description
 * @property {string} [difficulty]  // "Easy" | "Medium" | "Hard"
 * @property {string} [imageUrl]    // optional thumbnail
 */

export default function ChallengeCard({
                                          id,
                                          title,
                                          description,
                                          difficulty = "Medium",
                                          imageUrl,
                                      }) {
    return (
        <Link to={`/challenges/${id}`} className="group block h-full">
            {/* Card wrapper */}
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow transition-shadow hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                {/* Optional cover image */}
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={title}
                        className="h-48 w-full object-cover"
                    />
                )}

                {/* Body */}
                <div className="flex flex-1 flex-col p-4">
                    <h3 className="mb-2 text-lg font-semibold group-hover:underline">
                        {title}
                    </h3>

                    <p className="mb-4 flex-1 text-sm text-zinc-500 line-clamp-3 dark:text-zinc-400">
                        {description}
                    </p>

                    {/* Difficulty badge */}
                    <span
                        className="inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800 dark:bg-primary-900/20 dark:text-primary-300"
                        aria-label={`Difficulty: ${difficulty}`}
                    >
            {difficulty}
          </span>
                </div>
            </div>
        </Link>
    );
}
