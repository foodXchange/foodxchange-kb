"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Tooltip } from "@/components/kb/Tooltip";

interface Category {
  id: string;
  title: string;
  slug: string;
  icon: string;
  display_order: number;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  status: "draft" | "published";
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: arts }] = await Promise.all([
        supabase
          .from("kb_categories")
          .select("id, title, slug, icon, display_order")
          .order("display_order"),
        supabase
          .from("kb_articles")
          .select("id, title, slug, category_id, status")
          .order("display_order")
          .order("created_at"),
      ]);
      if (cats) {
        setCategories(cats);
        const initial: Record<string, boolean> = {};
        cats.forEach((c: Category) => (initial[c.id] = true));
        setExpanded(initial);
      }
      if (arts) setArticles(arts);
    }
    load();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function handleSearch(e: React.SyntheticEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <aside className="w-64 shrink-0 bg-slate-900 flex flex-col fixed left-0 top-14 bottom-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Tooltip content="Go to dashboard" position="right">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://fdx.trading/logo-white.png"
              alt="FoodXchange"
              className="h-6 w-auto"
            />
            <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">
              KB
            </span>
          </Link>
        </Tooltip>

        {/* Search */}
        <Tooltip content="Search all articles" shortcut="Ctrl+K" position="right" className="w-full mt-3">
          <form onSubmit={handleSearch} className="w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles…"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-500 outline-none focus:border-orange-500/50 transition"
            />
          </form>
        </Tooltip>
      </div>

      {/* Category + Article tree */}
      <nav className="flex-1 overflow-y-auto py-3">
        {categories.map((cat) => {
          const catArticles = articles.filter((a) => a.category_id === cat.id);
          const isExpanded = expanded[cat.id] ?? true;

          return (
            <div key={cat.id} className="mb-1">
              {/* Category header */}
              <div className="flex items-center gap-1 px-3 py-1.5 group">
                <button
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [cat.id]: !isExpanded }))
                  }
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <span className="text-base leading-none">{cat.icon || "📁"}</span>
                  <span className="text-slate-400 text-xs uppercase tracking-wider font-medium flex-1 truncate">
                    {cat.title}
                  </span>
                  <Tooltip
                    content={isExpanded ? "Collapse category" : "Expand category"}
                    position="right"
                  >
                    <svg
                      className={`w-3 h-3 text-slate-500 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Tooltip>
                </button>
                <Link
                  href={`/articles/new?category=${cat.id}`}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-orange-400 transition text-lg leading-none ml-1"
                  title="New article in this category"
                >
                  +
                </Link>
              </div>

              {/* Articles */}
              {isExpanded && (
                <div className="mb-1">
                  {catArticles.length === 0 ? (
                    <Link
                      href={`/articles/new?category=${cat.id}`}
                      className="block mx-3 px-3 py-1.5 text-xs text-slate-600 italic hover:text-slate-400 transition"
                    >
                      + Add first article
                    </Link>
                  ) : (
                    catArticles.map((article) => {
                      const isActive = pathname === `/articles/${article.slug}` || pathname === `/articles/${article.slug}/edit`;
                      return (
                        <Link
                          key={article.id}
                          href={`/articles/${article.slug}`}
                          className={`flex items-center gap-2 mx-2 px-3 py-1.5 rounded-lg text-sm transition ${
                            isActive
                              ? "text-orange-400 bg-orange-500/10 border-l-2 border-orange-500"
                              : "text-slate-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Tooltip
                            content={article.status === "published" ? "Published — visible in search" : "Draft — only visible to you"}
                            position="right"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                article.status === "published"
                                  ? "bg-green-400"
                                  : "bg-slate-500"
                              }`}
                            />
                          </Tooltip>
                          <span className="truncate">{article.title}</span>
                        </Link>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}

        {categories.length === 0 && (
          <p className="text-slate-600 text-xs text-center px-4 py-6">
            No categories yet
          </p>
        )}
      </nav>

      {/* Platform links */}
      <div className="px-3 py-3 border-t border-white/10">
        <Tooltip content="Every platform change, fix, and feature" position="right" className="w-full">
          <a
            href="/changelog"
            className="flex items-center gap-3 px-3 py-2 text-slate-400 text-sm hover:text-white hover:bg-white/5 rounded-lg transition w-full"
          >
            <span className="text-base">📋</span>
            <span>Changelog</span>
          </a>
        </Tooltip>
      </div>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <Tooltip content="Create a new article" position="right" className="w-full">
          <Link
            href="/articles/new"
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl py-2 transition w-full"
          >
            <span className="text-base leading-none">+</span>
            New article
          </Link>
        </Tooltip>
        <Tooltip content="Sign out of the knowledge base" position="right" className="w-full">
          <button
            onClick={handleLogout}
            className="w-full text-slate-400 hover:text-slate-200 text-sm py-2 rounded-xl hover:bg-white/5 transition"
          >
            Sign out
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
