import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ArticleEditor } from "@/components/ArticleEditor";
import { requireAuth } from "@/lib/requireAuth";

export default async function NewArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireAuth();
  const { category } = await searchParams;

  const { data: categories } = await supabaseAdmin
    .from("kb_categories")
    .select("id, title")
    .order("display_order");

  return (
    <ArticleEditor
      article={null}
      categories={categories ?? []}
      defaultCategoryId={category}
    />
  );
}
