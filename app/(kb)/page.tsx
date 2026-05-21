import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth } from "@/lib/requireAuth";

type ChangelogType = "feature" | "fix" | "improvement" | "security" | "breaking" | "infra";
const TYPE_BADGE: Record<ChangelogType, string> = {
  feature:     "bg-blue-50 text-blue-700",
  fix:         "bg-red-50 text-red-600",
  improvement: "bg-green-50 text-green-700",
  security:    "bg-orange-50 text-orange-700",
  breaking:    "bg-red-100 text-red-800",
  infra:       "bg-slate-100 text-slate-600",
};
const TYPE_LABEL: Record<ChangelogType, string> = {
  feature: "Feature", fix: "Fix", improvement: "Improvement",
  security: "Security", breaking: "Breaking", infra: "Infra",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  await requireAuth();
  const [
    { count: totalCount },
    { count: publishedCount },
    { count: catCount },
    { data: recent },
    { data: latestUpdated },
    { data: recentChanges },
  ] = await Promise.all([
    supabaseAdmin.from("kb_articles").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("kb_articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabaseAdmin.from("kb_categories").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("kb_articles")
      .select("id, title, slug, status, updated_at, category_id")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("kb_articles")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1),
    supabaseAdmin
      .from("kb_changelog")
      .select("id, version, title, type, released_at")
      .order("released_at", { ascending: false })
      .limit(3),
  ]);

  const categoryIds = [...new Set((recent ?? []).map((a) => a.category_id).filter(Boolean))];
  let categoryMap: Record<string, string> = {};
  if (categoryIds.length > 0) {
    const { data: cats } = await supabaseAdmin
      .from("kb_categories")
      .select("id, title")
      .in("id", categoryIds);
    if (cats) {
      categoryMap = Object.fromEntries(cats.map((c) => [c.id, c.title]));
    }
  }

  const lastUpdated = latestUpdated?.[0]?.updated_at;

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <h1 className="text-3xl font-semibold text-slate-900">
        Welcome to FoodXchange KB
      </h1>
      <p className="text-slate-500 mt-1">Your platform knowledge base</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
        {[
          { label: "Total Articles", value: totalCount ?? 0 },
          { label: "Published", value: publishedCount ?? 0 },
          { label: "Categories", value: catCount ?? 0 },
          {
            label: "Last Updated",
            value: lastUpdated ? formatDate(lastUpdated) : "—",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-50 border border-slate-100 rounded-xl p-4"
          >
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent articles */}
      <div className="mt-10">
        <h2 className="text-base font-semibold text-slate-700 mb-3">
          Recently Updated
        </h2>
        {(recent ?? []).length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center mt-6">
            <p className="text-4xl mb-4">📝</p>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No articles yet
            </h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              Start building your knowledge base. Create your first article to
              document a workflow, feature, or process.
            </p>
            <a
              href="/articles/new"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-medium transition"
            >
              ✍️ Write first article
            </a>
            <p className="text-slate-400 text-xs mt-6">
              Tip: Type / in the editor to add any block type — headings,
              images, videos, PDFs, and more.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {(recent ?? []).map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {article.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {categoryMap[article.category_id] ?? "Uncategorized"} ·{" "}
                    {formatDate(article.updated_at)}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    article.status === "published"
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {article.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent changes */}
      {(recentChanges ?? []).length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-700">Recent changes</h2>
            <Link href="/changelog" className="text-sm text-orange-600 hover:text-orange-700 transition">
              View full changelog →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {(recentChanges ?? []).map((entry) => {
              const t = entry.type as ChangelogType;
              const daysAgo = Math.floor(
                (Date.now() - new Date(entry.released_at).getTime()) / 86400000
              );
              return (
                <div key={entry.id} className="flex items-center gap-3 py-3">
                  <span className="font-mono text-xs bg-slate-100 rounded px-2 py-0.5 text-slate-700 shrink-0">
                    {entry.version}
                  </span>
                  <span className="text-sm text-slate-700 flex-1 truncate">{entry.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TYPE_BADGE[t]}`}>
                    {TYPE_LABEL[t]}
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">
                    {daysAgo === 0 ? "today" : `${daysAgo}d ago`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-10 flex gap-3">
        <Link
          href="/articles/new"
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
        >
          New article
        </Link>
        <Link
          href="/categories"
          className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-sm font-medium transition"
        >
          All categories
        </Link>
      </div>
    </div>
  );
}
