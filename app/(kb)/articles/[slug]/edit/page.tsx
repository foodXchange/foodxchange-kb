import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ArticleEditor } from "@/components/ArticleEditor";
import { requireAuth } from "@/lib/requireAuth";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAuth();
  const { slug } = await params;

  const [{ data: article }, { data: categories }] = await Promise.all([
    supabaseAdmin.from("kb_articles").select("*").eq("slug", slug).single(),
    supabaseAdmin
      .from("kb_categories")
      .select("id, title")
      .order("display_order"),
  ]);

  if (!article) notFound();

  return <ArticleEditor article={article} categories={categories ?? []} />;
}
