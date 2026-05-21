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

export default async function DashboardPage() {
  await requireAuth();
  const [
    { count: totalCount },
    { count: publishedCount },
    { count: catCount },
    { data: recent },
    { data: latestUpdated },
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
          <p className="text-slate-400 text-sm">No articles yet.</p>
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
