"use client";

import { useState } from "react";

type EntryType = "feature" | "fix" | "improvement" | "security" | "breaking" | "infra";

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string | null;
  type: EntryType;
  items: string[];
  author: string;
  released_at: string;
}

interface ChangelogViewProps {
  entries: ChangelogEntry[];
}

const TYPE_STYLES: Record<EntryType, string> = {
  feature:     "bg-blue-50 text-blue-700 border border-blue-200",
  fix:         "bg-red-50 text-red-600 border border-red-200",
  improvement: "bg-green-50 text-green-700 border border-green-200",
  security:    "bg-orange-50 text-orange-700 border border-orange-200",
  breaking:    "bg-red-100 text-red-800 border border-red-300",
  infra:       "bg-slate-50 text-slate-600 border border-slate-200",
};

const TYPE_LABELS: Record<EntryType, string> = {
  feature:     "New feature",
  fix:         "Bug fix",
  improvement: "Improvement",
  security:    "Security",
  breaking:    "Breaking change",
  infra:       "Infrastructure",
};

const DOT_COLORS: Record<EntryType, string> = {
  feature:     "bg-blue-500",
  fix:         "bg-red-500",
  improvement: "bg-green-500",
  security:    "bg-orange-500",
  breaking:    "bg-red-700",
  infra:       "bg-slate-400",
};

const FILTERS: { label: string; value: string }[] = [
  { label: "All",             value: "all" },
  { label: "Features",        value: "feature" },
  { label: "Fixes",           value: "fix" },
  { label: "Improvements",    value: "improvement" },
  { label: "Infrastructure",  value: "infra" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ChangelogView({ entries }: ChangelogViewProps) {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all"
    ? entries
    : entries.filter((e) => e.type === filter);

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <h1 className="text-3xl font-semibold text-slate-900">Platform Changelog</h1>
      <p className="text-slate-500 mt-1 mb-8">
        Every change, fix, and feature shipped.
      </p>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap mb-10">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f.value
                ? "bg-orange-500 text-white"
                : "border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-400 text-sm">No entries for this filter.</p>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-slate-100" />

          <div className="space-y-8">
            {filtered.map((entry) => (
              <div key={entry.id} className="flex gap-6 items-start">
                {/* Left: version + date */}
                <div className="w-20 flex-shrink-0 text-right pt-6">
                  <p className="text-sm font-mono font-bold text-slate-900">
                    {entry.version}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDate(entry.released_at)}
                  </p>
                </div>

                {/* Timeline dot */}
                <div className="flex-shrink-0 mt-7 z-10">
                  <div
                    className={`w-3 h-3 rounded-full ring-4 ring-white ${DOT_COLORS[entry.type]}`}
                  />
                </div>

                {/* Entry card */}
                <div className="flex-1 border border-slate-100 rounded-xl p-6 hover:border-slate-200 transition mb-1">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${TYPE_STYLES[entry.type]}`}
                      >
                        {TYPE_LABELS[entry.type]}
                      </span>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {entry.title}
                      </h2>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      by {entry.author}
                    </span>
                  </div>

                  {entry.description && (
                    <p className="text-slate-600 text-sm mb-4">
                      {entry.description}
                    </p>
                  )}

                  {entry.items.length > 0 && (
                    <ul className="space-y-1.5">
                      {entry.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-slate-700"
                        >
                          <span className="text-green-500 font-medium mt-0.5 flex-shrink-0">
                            ✓
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
