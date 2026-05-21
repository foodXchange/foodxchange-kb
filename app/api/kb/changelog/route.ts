import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ChangelogSchema = z.object({
  version: z.string().min(1).max(50),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  type: z.enum(["feature", "fix", "improvement", "security", "breaking", "infra"]),
  items: z.array(z.string().max(500)),
  author: z.string().max(100).optional(),
  released_at: z.string().optional(),
});

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("kb_changelog")
    .select("*")
    .order("released_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ entries: data ?? [] });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ChangelogSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const payload = {
    ...parsed.data,
    released_at: parsed.data.released_at ?? new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("kb_changelog")
    .insert(payload)
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, id: data.id });
}
