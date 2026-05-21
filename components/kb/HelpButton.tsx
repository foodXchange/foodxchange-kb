"use client";

import { useState } from "react";

type View = "menu" | "shortcuts" | "editor" | "images" | "ai";

const SHORTCUTS = [
  { action: "Search articles",    keys: "Ctrl+K / Cmd+K" },
  { action: "Save article",       keys: "Auto (1.5s)" },
  { action: "Bold text",          keys: "Ctrl+B / Cmd+B" },
  { action: "Italic text",        keys: "Ctrl+I / Cmd+I" },
  { action: "Underline",          keys: "Ctrl+U / Cmd+U" },
  { action: "Add a block",        keys: "/" },
  { action: "Heading 1",          keys: "# + Space" },
  { action: "Heading 2",          keys: "## + Space" },
  { action: "Heading 3",          keys: "### + Space" },
  { action: "Bullet list",        keys: "- + Space" },
  { action: "Numbered list",      keys: "1. + Space" },
  { action: "Quote block",        keys: "> + Space" },
  { action: "Send AI message",    keys: "Ctrl+Enter" },
];

const EDITOR_TIPS = [
  { label: "Start typing",    desc: "Click anywhere in the edit area to begin. The editor works like Notion or Google Docs." },
  { label: "Add any block",   desc: "Type / on a new line to open the block menu. Choose from headings, lists, images, videos, files, quotes, and code blocks." },
  { label: "Format text",     desc: "Select any text to see the formatting toolbar. Bold, italic, underline, link, and more." },
  { label: "Auto-save",       desc: "Your work saves automatically every 1.5 seconds. Watch for \"Saved\" in the top bar." },
  { label: "Publish",         desc: "Toggle Published in the top bar when ready. Draft articles are only visible to you." },
];

const IMAGES_TIPS = [
  { label: "Add an image",    desc: "Type /image or drag and drop any image file. Supports JPG, PNG, WebP, GIF. Uploads automatically to Supabase storage." },
  { label: "Embed a video",   desc: "Type /video and paste a YouTube, Loom, or Vimeo URL. The video embeds and plays inline. No file upload needed." },
  { label: "Attach a PDF",    desc: "Type /file and upload any PDF or document. Readers can click to open or download. Stores in Supabase storage bucket: kb" },
  { label: "Image from URL",  desc: "In the image block, paste any public image URL instead of uploading a file." },
];

const AI_TIPS = [
  { label: "Open the panel",  desc: "Click ✦ AI Assistant in the editor top bar. The panel slides in from the right side." },
  { label: "Chat",            desc: "Ask anything about the article you are editing. The AI has context about the current article content." },
  { label: "Write",           desc: "Describe content to write and the AI drafts it. Click Insert to add it to your article." },
  { label: "Improve",         desc: "Ask the AI to improve, simplify, or expand selected text." },
  { label: "Suggest tags",    desc: "Click Suggest tags and the AI analyzes your content and suggests 10-15 relevant tags automatically." },
  { label: "Summarize",       desc: "Click Summarize to generate a 2-3 sentence summary suitable for the article excerpt field." },
];

function TipList({ tips }: { tips: { label: string; desc: string }[] }) {
  return (
    <div className="space-y-3 text-sm text-slate-300">
      {tips.map((tip) => (
        <div key={tip.label}>
          <span className="font-medium text-white">{tip.label} — </span>
          {tip.desc}
        </div>
      ))}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-orange-400 text-xs px-5 pt-4 pb-1 block hover:text-orange-300 transition"
    >
      ← Back
    </button>
  );
}

export default function HelpButton() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");

  function handleOpen() {
    setOpen((o) => !o);
    setView("menu");
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 shadow-lg flex items-center justify-center text-white transition-all duration-200"
        aria-label="Help"
      >
        {open ? <span className="text-xl leading-none">×</span> : <span className="text-lg font-semibold">?</span>}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-40 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeSlideUp">
          {view === "menu" && (
            <>
              <div className="py-4 px-5 border-b border-white/10">
                <p className="text-white font-medium text-sm">Help &amp; Reference</p>
              </div>
              <div>
                {[
                  { icon: "✍️", label: "How to write an article",    target: "editor" as View },
                  { icon: "🖼️", label: "Adding images, videos, PDFs", target: "images" as View },
                  { icon: "✦",  label: "Using the AI assistant",      target: "ai" as View },
                  { icon: "⌨️", label: "Keyboard shortcuts",          target: "shortcuts" as View },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setView(item.target)}
                    className="w-full text-left px-5 py-3.5 text-slate-300 text-sm hover:bg-white/5 hover:text-white flex items-center gap-3 transition border-b border-white/5"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    localStorage.removeItem("kb_onboarding_complete");
                    window.location.reload();
                  }}
                  className="w-full text-left px-5 py-3.5 text-slate-300 text-sm hover:bg-white/5 hover:text-white flex items-center gap-3 transition"
                >
                  <span>📖</span>
                  Rerun onboarding tour
                </button>
              </div>
            </>
          )}

          {view === "editor" && (
            <>
              <BackButton onClick={() => setView("menu")} />
              <p className="text-white font-medium text-sm px-5 pb-3">Writing articles</p>
              <div className="px-5 pb-5 max-h-72 overflow-y-auto">
                <TipList tips={EDITOR_TIPS} />
              </div>
            </>
          )}

          {view === "images" && (
            <>
              <BackButton onClick={() => setView("menu")} />
              <p className="text-white font-medium text-sm px-5 pb-3">Media &amp; files</p>
              <div className="px-5 pb-5 max-h-72 overflow-y-auto">
                <TipList tips={IMAGES_TIPS} />
              </div>
            </>
          )}

          {view === "ai" && (
            <>
              <BackButton onClick={() => setView("menu")} />
              <p className="text-white font-medium text-sm px-5 pb-3">AI writing assistant</p>
              <div className="px-5 pb-5 max-h-72 overflow-y-auto">
                <TipList tips={AI_TIPS} />
              </div>
            </>
          )}

          {view === "shortcuts" && (
            <>
              <BackButton onClick={() => setView("menu")} />
              <p className="text-white font-medium text-sm px-5 pb-3">Keyboard shortcuts</p>
              <div className="px-5 pb-5 max-h-72 overflow-y-auto">
                {SHORTCUTS.map((s) => (
                  <div
                    key={s.action}
                    className="flex justify-between items-center py-2 border-b border-white/5 text-sm"
                  >
                    <span className="text-slate-300">{s.action}</span>
                    <kbd className="bg-white/10 rounded px-2 py-0.5 text-slate-400 font-mono text-xs">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
