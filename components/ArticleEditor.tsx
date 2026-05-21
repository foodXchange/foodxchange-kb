"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { Block } from "@blocknote/core";
import { AIAssistant } from "@/components/kb/AIAssistant";
import { Tooltip } from "@/components/kb/Tooltip";
import { VersionHistory } from "@/components/kb/VersionHistory";

interface ArticleEditorProps {
  article: {
    id: string;
    title: string;
    slug: string;
    content: unknown;
    status: "draft" | "published";
    category_id: string | null;
    cover_image: string | null;
  } | null;
  categories: { id: string; title: string }[];
  defaultCategoryId?: string;
}

type SaveStatus = "saved" | "saving" | "unsaved" | "idle";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function extractPlainText(blocks: Block[]): string {
  return blocks
    .flatMap((block) => {
      if (!Array.isArray(block.content)) return [];
      return (block.content as Array<{ type: string; text?: string }>)
        .filter((c) => c.type === "text" && typeof c.text === "string")
        .map((c) => c.text ?? "");
    })
    .join(" ")
    .slice(0, 10000);
}

export function ArticleEditor({ article, categories, defaultCategoryId }: ArticleEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [categoryId, setCategoryId] = useState(
    article?.category_id ?? defaultCategoryId ?? ""
  );
  const [coverImage, setCoverImage] = useState(article?.cover_image ?? "");
  const [status, setStatus] = useState<"draft" | "published">(
    article?.status ?? "draft"
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [metaOpen, setMetaOpen] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [editCount, setEditCount] = useState(0);
  const [plainText, setPlainText] = useState("");
  const articleIdRef = useRef<string | null>(article?.id ?? null);
  const articleSlugRef = useRef<string>(article?.slug ?? "");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slugEditedByUser = useRef(!!article?.slug);

  const editor = useCreateBlockNote({
    initialContent:
      Array.isArray(article?.content) && (article.content as Block[]).length > 0
        ? (article.content as Block[])
        : undefined,
    uploadFile: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/kb/upload", { method: "POST", body: formData });
      const { url } = await res.json();
      return url as string;
    },
  });

  // Extract plain text for AI context — updated on every editor change
  useEffect(() => {
    function update() {
      setPlainText(extractPlainText(editor.document));
    }
    update();
    const unsubscribe = editor.onChange(update);
    return () => { unsubscribe?.(); };
  }, [editor]);

  const save = useCallback(
    async (explicitStatus?: "draft" | "published") => {
      const currentTitle = title.trim();
      if (!currentTitle) return;

      setSaveStatus("saving");
      const currentStatus = explicitStatus ?? status;
      const currentSlug = slug || slugify(currentTitle) || "untitled";

      const blocks = editor.document;

      const payload = {
        id: articleIdRef.current ?? undefined,
        title: currentTitle,
        slug: currentSlug,
        content: blocks,
        content_text: "",
        category_id: categoryId || null,
        status: currentStatus,
        cover_image: coverImage || null,
      };

      try {
        const res = await fetch("/api/kb/articles/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          articleIdRef.current = data.id;
          articleSlugRef.current = data.slug;
          setSaveStatus("saved");
          setSavedAt(new Date());
          // Save a version every 10 successful saves (fire-and-forget)
          setEditCount((c) => {
            const next = c + 1;
            if (next % 10 === 0 && articleIdRef.current) {
              fetch("/api/kb/versions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  articleId: articleIdRef.current,
                  title: currentTitle,
                  content: blocks,
                  contentText: extractPlainText(blocks as Block[]),
                  versionLabel: "auto-save",
                }),
              }).catch(() => {});
            }
            return next;
          });
          if (explicitStatus) setStatus(currentStatus);
          if (!article) {
            router.replace(`/articles/${data.slug}/edit`);
          } else if (data.slug !== article.slug) {
            router.replace(`/articles/${data.slug}/edit`);
          }
        } else {
          setSaveStatus("unsaved");
        }
      } catch {
        setSaveStatus("unsaved");
      }
    },
    [title, slug, status, categoryId, coverImage, editor, article, router]
  );

  // Auto-save on editor content change
  useEffect(() => {
    const unsubscribe = editor.onChange(() => {
      setSaveStatus("unsaved");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(), 1500);
    });
    return () => {
      unsubscribe?.();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [editor, save]);

  // Auto-save on title change
  useEffect(() => {
    if (!title) return;
    if (!slugEditedByUser.current) {
      setSlug(slugify(title));
    }
    setSaveStatus("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(), 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  function saveVersionNow() {
    if (!articleIdRef.current) return;
    const label = `Manual save — ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    fetch("/api/kb/versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleId: articleIdRef.current,
        title: title.trim(),
        content: editor.document,
        contentText: plainText,
        versionLabel: label,
      }),
    }).catch(() => {});
  }

  function handleRestore(content: unknown, restoredTitle: string) {
    editor.replaceBlocks(editor.document, content as Block[]);
    setTitle(restoredTitle);
    setShowVersions(false);
  }

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-8 py-3 flex items-center gap-4">
        <Link
          href={article ? `/articles/${article.slug}` : "/"}
          className="text-slate-400 hover:text-slate-700 transition text-sm"
        >
          ← Back
        </Link>
        <span className="text-slate-300">|</span>
        <Tooltip content="Articles save automatically every 1.5 seconds" position="bottom">
          <span className="text-sm text-slate-400 flex-1 cursor-default">
            {saveStatus === "saving" && "Saving…"}
            {saveStatus === "saved" &&
              `Saved${savedAt ? ` at ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}`}
            {saveStatus === "unsaved" && "Unsaved changes"}
            {saveStatus === "idle" && ""}
          </span>
        </Tooltip>
        {articleIdRef.current && (
          <>
            <Tooltip content="View and restore previous versions" position="bottom">
              <button
                type="button"
                onClick={() => setShowVersions((s) => !s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                  showVersions
                    ? "bg-slate-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                🕐 History
              </button>
            </Tooltip>
            <button
              type="button"
              onClick={saveVersionNow}
              className="text-slate-400 text-xs hover:text-slate-700 transition"
            >
              Save version
            </button>
          </>
        )}
        <Tooltip content="Open AI writing assistant" position="bottom">
          <button
            type="button"
            onClick={() => setShowAI((s) => !s)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              showAI
                ? "bg-orange-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>✦</span>
            AI Assistant
          </button>
        </Tooltip>
        <Tooltip
          content={status === "published" ? "Click to unpublish (make draft)" : "Click to publish (make visible)"}
          position="bottom"
        >
          <button
            onClick={() => setStatus((s) => (s === "draft" ? "published" : "draft"))}
            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition ${
              status === "published"
                ? "border-green-300 text-green-700 bg-green-50"
                : "border-slate-200 text-slate-500 bg-slate-50"
            }`}
          >
            {status === "published" ? "Published" : "Draft"}
          </button>
        </Tooltip>
        <button
          onClick={() => save(status === "published" ? "published" : "published")}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition"
        >
          {status === "published" ? "Save" : "Publish"}
        </button>
        {status === "published" && (
          <button
            onClick={() => save("draft")}
            className="text-sm text-slate-500 hover:text-slate-700 transition"
          >
            Unpublish
          </button>
        )}
      </div>

      {/* Content row: editor + AI panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor column */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="px-8 py-8 max-w-4xl mx-auto">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title…"
              className="w-full text-3xl font-semibold text-slate-900 border-none outline-none placeholder-slate-300 bg-transparent mb-4"
            />

            {/* Metadata bar */}
            <div className="mb-6">
              <button
                onClick={() => setMetaOpen((o) => !o)}
                className="text-xs text-slate-400 hover:text-slate-600 transition mb-2"
              >
                {metaOpen ? "▲ Hide metadata" : "▼ Show metadata"}
              </button>

              {metaOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <Tooltip content="Choose which sidebar category this article belongs to" position="top" className="w-full">
                  <label className="text-xs text-slate-500 block mb-1 cursor-default">Category</label>
                </Tooltip>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white outline-none focus:border-orange-400 transition"
                    >
                      <option value="">No category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Tooltip content="URL-safe identifier. Auto-generated from title. Used in the article URL." position="top" className="w-full">
                  <label className="text-xs text-slate-500 block mb-1 cursor-default">Slug</label>
                </Tooltip>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        slugEditedByUser.current = true;
                        setSlug(e.target.value);
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white outline-none focus:border-orange-400 transition font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-500 block mb-1">Cover image URL</label>
                    <input
                      type="text"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="https://…"
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white outline-none focus:border-orange-400 transition"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* BlockNote editor */}
            <BlockNoteView editor={editor} theme="light" />
          </div>
        </div>

        {/* Version history panel */}
        {showVersions && articleIdRef.current && (
          <VersionHistory
            articleId={articleIdRef.current}
            articleTitle={title || article?.title || "Untitled"}
            onRestore={handleRestore}
            onClose={() => setShowVersions(false)}
          />
        )}

        {/* AI panel */}
        {showAI && (
          <AIAssistant
            articleTitle={title || article?.title || "Untitled"}
            articleContent={plainText}
            category={categories.find((c) => c.id === categoryId)?.title ?? ""}
            onInsert={(text) => {
              const lastBlock = editor.document[editor.document.length - 1];
              if (!lastBlock) return;
              editor.insertBlocks(
                [{ type: "paragraph", content: [{ type: "text", text, styles: {} }] }],
                lastBlock,
                "after"
              );
            }}
            onClose={() => setShowAI(false)}
          />
        )}
      </div>
    </div>
  );
}
