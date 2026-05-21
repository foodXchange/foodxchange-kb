import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ArticleContent } from "@/components/ArticleContent";
import { requireAuth } from "@/lib/requireAuth";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAuth();
  const { slug } = await params;

  const { data: article } = await supabaseAdmin
    .from("kb_articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!article) notFound();

  let categoryTitle = "";
  if (article.category_id) {
    const { data: cat } = await supabaseAdmin
      .from("kb_categories")
      .select("title")
      .eq("id", article.category_id)
      .single();
    categoryTitle = cat?.title ?? "";
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        {categoryTitle && (
          <>
            <span>{categoryTitle}</span>
            <span>›</span>
          </>
        )}
        <span className="text-slate-600">{article.title}</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-semibold text-slate-900">{article.title}</h1>

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-3">
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            article.status === "published"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-slate-100 text-slate-500 border border-slate-200"
          }`}
        >
          {article.status === "published" ? "Published" : "Draft"}
        </span>
        <span className="text-sm text-slate-400">
          Last updated {formatDate(article.updated_at)}
        </span>
        <Link
          href={`/articles/${slug}/edit`}
          className="ml-auto text-sm text-orange-500 hover:text-orange-600 font-medium transition"
        >
          Edit →
        </Link>
      </div>

      {/* Cover image */}
      {article.cover_image && (
        <div className="mt-6 rounded-xl overflow-hidden">
          <Image
            src={article.cover_image}
            alt={article.title}
            width={900}
            height={400}
            className="w-full max-h-64 object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="mt-8 prose prose-slate max-w-none">
        <ArticleContent content={article.content} />
      </div>
    </div>
  );
}
