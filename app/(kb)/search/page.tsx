import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth } from "@/lib/requireAuth";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function highlightTerm(text: string, term: string): string {
  if (!term) return text;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(
    new RegExp(`(${escaped})`, "gi"),
    "<mark class=\"bg-orange-100 text-orange-800\">$1</mark>"
  );
}

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  content_text: string;
  category_id: string;
  status: string;
  updated_at: string;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAuth();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let results: SearchResult[] = [];
  let categoryMap: Record<string, string> = {};

  if (query) {
    const { data } = await supabaseAdmin
      .from("kb_articles")
      .select("id, title, slug, content_text, category_id, status, updated_at")
      .eq("status", "published")
      .textSearch("search_vector", query, {
        type: "plain",
        config: "english",
      })
      .limit(20);

    results = data ?? [];

    const categoryIds = [...new Set(results.map((r) => r.category_id).filter(Boolean))];
    if (categoryIds.length > 0) {
      const { data: cats } = await supabaseAdmin
        .from("kb_categories")
        .select("id, title")
        .in("id", categoryIds);
      if (cats) categoryMap = Object.fromEntries(cats.map((c) => [c.id, c.title]));
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Search</h1>

      <form method="GET" action="/search">
        <input
          name="q"
          type="text"
          defaultValue={query}
          placeholder="Search articles…"
          autoFocus
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-base outline-none focus:border-orange-400 transition"
        />
      </form>

      {query && (
        <div className="mt-8">
          <p className="text-sm text-slate-500 mb-4">
            {results.length === 0
              ? `No results for "${query}"`
              : `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`}
          </p>

          <div className="space-y-4">
            {results.map((result) => {
              const excerpt = result.content_text?.slice(0, 150) ?? "";
              return (
                <Link
                  key={result.id}
                  href={`/articles/${result.slug}`}
                  className="block border border-slate-100 rounded-xl p-4 hover:border-orange-200 hover:bg-orange-50/30 transition"
                >
                  <h2
                    className="font-medium text-slate-900"
                    dangerouslySetInnerHTML={{
                      __html: highlightTerm(result.title, query),
                    }}
                  />
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                    {excerpt}
                    {excerpt.length === 150 ? "…" : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span>{categoryMap[result.category_id] ?? "Uncategorized"}</span>
                    <span>·</span>
                    <span>{formatDate(result.updated_at)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!query && (
        <p className="mt-8 text-slate-400 text-sm">
          Type above to search published articles.
        </p>
      )}
    </div>
  );
}
