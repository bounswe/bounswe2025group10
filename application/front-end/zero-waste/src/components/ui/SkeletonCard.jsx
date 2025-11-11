import React from "react";

/** Simple animated “pulse” placeholder while challenges load */
export default function SkeletonCard() {
    return (
        <div className="h-60 animate-pulse space-y-2 rounded-2xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="h-5 w-1/2 rounded bg-zinc-300/60 dark:bg-zinc-700" />
            <div className="h-4 w-full rounded bg-zinc-300/60 dark:bg-zinc-700" />
            <div className="h-4 w-2/3 rounded bg-zinc-300/60 dark:bg-zinc-700" />
            <div className="mt-auto h-6 w-20 rounded-full bg-zinc-300/60 dark:bg-zinc-700" />
        </div>
    );
}
