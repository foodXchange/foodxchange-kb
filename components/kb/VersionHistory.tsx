"use client";

import { useEffect, useState } from "react";

interface Version {
  id: string;
  title: string;
  version_label: string | null;
  saved_by: string;
  created_at: string;
}

interface FullVersion extends Version {
  content: unknown;
  content_text: string;
  article_id: string;
}

interface VersionHistoryProps {
  articleId: string;
  articleTitle: string;
  onRestore: (content: unknown, title: string) => void;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatFull(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VersionHistory({
  articleId,
  articleTitle,
  onRestore,
  onClose,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<FullVersion | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetch(`/api/kb/versions?articleId=${articleId}`)
      .then((r) => r.json())
      .then((d) => setVersions(d.versions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [articleId]);

  async function loadPreview(id: string) {
    setSelected(id);
    setPreview(null);
    try {
      const res = await fetch(`/api/kb/versions/${id}`);
      const data = await res.json();
      setPreview(data.version);
    } catch {
      // ignore
    }
  }

  async function handleRestore() {
    if (!preview) return;
    setRestoring(true);
    onRestore(preview.content, preview.title);
    setRestoring(false);
  }

  return (
    <div className="fixed left-64 top-14 h-[calc(100vh-3.5rem)] w-80 bg-white border-r border-slate-200 shadow-xl z-30 flex flex-col animate-slideInLeft">
      {/* Header */}
      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-5 flex-shrink-0">
        <span className="font-medium text-slate-900 text-sm">Version history</span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 transition text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : versions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400 text-sm leading-relaxed">
              No saved versions yet.
              <br />
              <br />
              Versions save automatically every 10 edits or when you click
              &ldquo;Save version&rdquo;.
            </p>
          </div>
        ) : (
          versions.map((v) => (
            <button
              key={v.id}
              onClick={() => loadPreview(v.id)}
              className={`w-full text-left px-5 py-4 border-b border-slate-50 transition ${
                selected === v.id
                  ? "bg-orange-50 border-l-2 border-orange-500"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-medium text-slate-800">
                  {timeAgo(v.created_at)}
                </span>
                {v.version_label && (
                  <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                    {v.version_label}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{formatFull(v.created_at)}</p>
            </button>
          ))
        )}
      </div>

      {/* Preview pane */}
      {selected && (
        <div className="border-t border-slate-100 p-4 flex-shrink-0">
          {preview ? (
            <>
              <p className="text-sm font-medium text-slate-800 mb-1.5 truncate">
                {preview.title}
              </p>
              <p className="text-xs text-slate-500 line-clamp-4">
                {preview.content_text?.slice(0, 200) || "No text content"}
              </p>
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm w-full py-2.5 rounded-lg mt-3 transition disabled:opacity-50"
              >
                {restoring ? "Restoring…" : "Restore this version"}
              </button>
              <p className="text-xs text-slate-400 mt-2 text-center">
                This will replace the current article content.
                <br />
                The current version will be saved first.
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center py-4">
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
