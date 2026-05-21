"use client";

import { useEffect, useState } from "react";

const STEPS = [
  {
    icon: "📚",
    title: "Welcome to FoodXchange KB",
    body: "Your platform knowledge base — everything you need to operate, develop, and grow the FoodXchange platform. Let us show you around in 30 seconds.",
    cta: "Let's go →",
  },
  {
    icon: "🗂️",
    title: "Navigate with the sidebar",
    body: "All categories and articles live in the left sidebar. Click any category to expand it. Click any article title to open it. The orange indicator shows your current article.",
    cta: "Next →",
  },
  {
    icon: "✍️",
    title: "Write like Notion",
    body: "Click anywhere in an article to start editing. Type / to see a menu of block types — headings, images, videos, PDFs, code blocks, and more. Your work saves automatically every 1.5 seconds.",
    cta: "Next →",
  },
  {
    icon: "🖼️",
    title: "Add images, videos, and PDFs",
    body: "Drag and drop any image into the editor. Type /video and paste a YouTube or Loom URL. Type /file and upload any PDF or document. Everything stores in Supabase storage automatically.",
    cta: "Next →",
  },
  {
    icon: "✦",
    title: "AI writing assistant",
    body: "Click the ✦ AI Assistant button when editing any article. Ask it to write content, improve your text, suggest tags, or answer questions about the platform. Powered by Anthropic Claude.",
    cta: "Next →",
  },
  {
    icon: "🔍",
    title: "Search everything",
    body: "Press Ctrl+K (or Cmd+K on Mac) anywhere to search all articles instantly. Search uses full-text matching across all article content.",
    cta: "Got it — let me explore",
  },
];

const STORAGE_KEY = "kb_onboarding_complete";

export default function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
  }, []);

  function complete() {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  }

  function next() {
    if (step === STEPS.length - 1) {
      complete();
    } else {
      setStep((s) => s + 1);
    }
  }

  if (!show) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-6 shadow-2xl">
        {/* Icon */}
        <div className="text-5xl text-center mb-4">{current.icon}</div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-white text-center mb-3">
          {current.title}
        </h2>

        {/* Body */}
        <p className="text-slate-400 text-sm leading-relaxed text-center mb-8">
          {current.body}
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition ${
                i === step ? "bg-orange-500" : "bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          {step < STEPS.length - 1 ? (
            <button
              onClick={complete}
              className="text-slate-500 text-sm hover:text-slate-400 transition"
            >
              Skip
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={next}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition"
          >
            {current.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
