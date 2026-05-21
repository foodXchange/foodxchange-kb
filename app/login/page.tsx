"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, rememberMe }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://fdx.trading/logo-white.png"
            alt="FoodXchange"
            className="h-7 w-auto"
          />
          <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">
            KB
          </span>
          <span className="text-slate-400 text-sm ml-1">Knowledge Base</span>
        </div>
        <a
          href="https://fdx.trading"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 text-sm hover:text-white transition"
        >
          ← Back to fdx.trading
        </a>
      </header>

      {/* Center */}
      <div className="flex-1 flex flex-col items-center max-w-md mx-auto w-full px-6 mt-[8vh]">
        {/* Icon + heading */}
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">🔐</span>
        </div>
        <h1 className="text-2xl font-semibold text-white text-center">
          Welcome back
        </h1>
        <p className="text-slate-400 text-sm text-center max-w-xs mx-auto mt-2 leading-relaxed">
          Sign in to access the FoodXchange platform knowledge base — workflows,
          architecture, and operational guides.
        </p>

        {/* Card */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 mt-8 shadow-2xl w-full">
          <form onSubmit={handleSubmit} className="space-y-1">
            {/* Password field */}
            <label className="block text-slate-400 text-sm mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoFocus
                className="rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-600 px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition text-sm px-1"
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-3 mt-4 pt-1">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-orange-500 cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="text-slate-400 text-sm cursor-pointer select-none"
              >
                Remember me for 7 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !password}
              className="bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all duration-150 text-white font-medium py-3 rounded-xl w-full mt-6 disabled:bg-orange-500/60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            {/* Error */}
            {error && (
              <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center gap-2">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Info text */}
        <p className="text-slate-600 text-xs text-center mt-6">
          This is a private knowledge base. For access requests contact{" "}
          <a
            href="mailto:info@foodz-x.com"
            className="hover:text-slate-400 transition"
          >
            info@foodz-x.com
          </a>
        </p>
      </div>

      {/* Footer */}
      <footer className="py-6 px-8 border-t border-white/5 flex items-center justify-between text-slate-600 text-xs mt-auto">
        <span>© 2026 FOODZXCHANGE · Tel Aviv, Israel</span>
        <div className="flex items-center gap-3">
          <a
            href="https://fdx.trading"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-400 transition"
          >
            fdx.trading
          </a>
          <span>·</span>
          <a
            href="mailto:info@foodz-x.com"
            className="hover:text-slate-400 transition"
          >
            info@foodz-x.com
          </a>
          <span>·</span>
          <a
            href="https://www.linkedin.com/company/foodxchange"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-400 transition"
          >
            LinkedIn
          </a>
        </div>
      </footer>
    </div>
  );
}
