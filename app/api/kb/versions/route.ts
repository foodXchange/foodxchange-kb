import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SaveVersionSchema = z.object({
  articleId: z.string().uuid(),
  title: z.string().min(1).max(500),
  content: z.unknown(),
  contentText: z.string().max(20000),
  versionLabel: z.string().max(200).optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("articleId");

  if (!articleId) {
    return Response.json({ error: "articleId required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("kb_article_versions")
    .select("id, title, version_label, saved_by, created_at")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ versions: data ?? [] });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SaveVersionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const { articleId, title, content, contentText, versionLabel } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from("kb_article_versions")
    .insert({
      article_id: articleId,
      title,
      content: content ?? null,
      content_text: contentText,
      version_label: versionLabel ?? null,
    })
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Prune to last 20 versions
  const { data: oldVersions } = await supabaseAdmin
    .from("kb_article_versions")
    .select("id")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false })
    .range(20, 100);

  if (oldVersions?.length) {
    const idsToDelete = oldVersions.map((v: { id: string }) => v.id);
    await supabaseAdmin
      .from("kb_article_versions")
      .delete()
      .in("id", idsToDelete);
  }

  return Response.json({ ok: true, id: data.id });
}
