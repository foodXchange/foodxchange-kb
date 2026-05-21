import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ArticleContent } from "@/components/ArticleContent";
import { requireAuth } from "@/lib/requireAuth";
import { Tooltip } from "@/components/kb/Tooltip";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface BlockNode {
  type?: string;
  props?: { level?: number };
  content?: Array<{ type?: string; text?: string }>;
}

interface Heading {
  text: string;
  anchor: string;
  level: number;
}

function extractHeadings(content: unknown): Heading[] {
  if (!Array.isArray(content)) return [];
  return (content as BlockNode[])
    .filter((b) => b.type === "heading")
    .map((b) => {
      const text = (b.content ?? [])
        .filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("");
      return {
        text,
        anchor: text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        level: b.props?.level ?? 2,
      };
    })
    .filter((h) => h.text.length > 0);
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

  const wordCount = article.content_text?.split(" ").filter(Boolean).length ?? 0;
  const readingMins = Math.max(1, Math.ceil(wordCount / 200));

  const headings = extractHeadings(article.content);
  const showToc = headings.length >= 3;

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
        <span className="text-xs text-slate-400">~{readingMins} min read</span>
        <div className="ml-auto flex items-center gap-3">
          <Tooltip
            content="Opens a print-ready version. Use Ctrl+P or the Save as PDF button."
            position="bottom"
          >
            <a
              href={`/api/kb/export/pdf?slug=${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-sm text-slate-600 hover:text-slate-900 transition"
            >
              📄 Export PDF
            </a>
          </Tooltip>
          <Link
            href={`/articles/${slug}/edit`}
            className="text-sm text-orange-500 hover:text-orange-600 font-medium transition"
          >
            Edit →
          </Link>
        </div>
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

      {/* Table of contents */}
      {showToc && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-6 mb-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            On this page
          </p>
          <ul className="space-y-1.5">
            {headings.map((h) => (
              <li key={h.anchor} style={{ paddingLeft: h.level > 2 ? "1rem" : undefined }}>
                <a
                  href={`#${h.anchor}`}
                  className="text-sm text-slate-600 hover:text-orange-600 transition flex items-center gap-2"
                >
                  <span className="text-slate-300">—</span>
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content */}
      <div className="mt-8 prose prose-slate max-w-none">
        <ArticleContent content={article.content} headings={headings} />
      </div>

      {/* Floating edit button */}
      <Link
        href={`/articles/${slug}/edit`}
        className="fixed bottom-6 right-24 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition z-30"
      >
        ✏️ Edit article
      </Link>
    </div>
  );
}
