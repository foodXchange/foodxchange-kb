import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SaveSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.unknown(),
  content_text: z.string(),
  category_id: z.string().optional().nullable(),
  status: z.enum(["draft", "published"]),
  cover_image: z.string().optional().nullable(),
});

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const b = block as Record<string, unknown>;
    if (Array.isArray(b.content)) {
      for (const inline of b.content) {
        if (inline && typeof inline === "object") {
          const i = inline as Record<string, unknown>;
          if (typeof i.text === "string") parts.push(i.text);
        }
      }
    }
    if (Array.isArray(b.children)) {
      parts.push(extractText(b.children));
    }
  }
  return parts.join(" ").trim();
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const { id, title, slug, content, category_id, status, cover_image } = parsed.data;
  const content_text = extractText(content);

  const payload = {
    title,
    slug,
    content: content ?? null,
    content_text,
    category_id: category_id ?? null,
    status,
    cover_image: cover_image ?? null,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabaseAdmin
      .from("kb_articles")
      .update(payload)
      .eq("id", id);
    if (error) {
      Sentry.captureException(new Error(error.message));
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ ok: true, id, slug });
  } else {
    const { data, error } = await supabaseAdmin
      .from("kb_articles")
      .insert(payload)
      .select("id, slug")
      .single();
    if (error) {
      Sentry.captureException(new Error(error.message));
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ ok: true, id: data.id, slug: data.slug });
  }
}
