import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth } from "@/lib/requireAuth";

export default async function CategoriesPage() {
  await requireAuth();
  const { data: categories } = await supabaseAdmin
    .from("kb_categories")
    .select("id, title, slug, icon, description, display_order")
    .order("display_order");

  const { data: articleCounts } = await supabaseAdmin
    .from("kb_articles")
    .select("category_id");

  const countMap: Record<string, number> = {};
  for (const row of articleCounts ?? []) {
    if (row.category_id) countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1;
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <h1 className="text-3xl font-semibold text-slate-900 mb-2">Categories</h1>
      <p className="text-slate-500 mb-8">Browse all knowledge base categories</p>

      {(categories ?? []).length === 0 ? (
        <p className="text-slate-400">No categories yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(categories ?? []).map((cat) => (
            <Link
              key={cat.id}
              href={`/articles/new?category=${cat.id}`}
              className="border border-slate-200 rounded-xl p-5 hover:border-orange-200 hover:shadow-sm transition group"
            >
              <div className="text-3xl mb-3">{cat.icon || "📁"}</div>
              <h2 className="font-semibold text-slate-900 group-hover:text-orange-600 transition">
                {cat.title}
              </h2>
              {cat.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                  {cat.description}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-3">
                {countMap[cat.id] ?? 0} article{(countMap[cat.id] ?? 0) === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
