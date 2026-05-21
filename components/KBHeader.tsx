"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function KBHeader() {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        window.location.href = "/search";
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="h-14 bg-slate-900 border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-40 flex-shrink-0">
      {/* Left: logo */}
      <Link href="/" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://fdx.trading/logo-white.png"
          alt="FoodXchange"
          className="h-7 w-auto"
        />
        <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded font-bold ml-1">
          KB
        </span>
      </Link>

      {/* Center: search shortcut */}
      <button
        onClick={() => router.push("/search")}
        className="hidden md:flex items-center gap-2 w-60 rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-slate-500 text-sm hover:border-white/20 hover:bg-white/8 transition"
      >
        <span>🔍</span>
        <span className="flex-1 text-left">Search articles…</span>
        <span className="text-slate-700 text-xs">⌘K</span>
      </button>

      {/* Right: links */}
      <div className="flex items-center">
        <a
          href="https://fdx.trading"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 text-xs hover:text-white transition"
        >
          ← fdx.trading
        </a>
        <span className="border-l border-white/10 h-4 mx-3" />
        <button
          onClick={handleLogout}
          className="text-slate-400 text-xs hover:text-white transition"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
