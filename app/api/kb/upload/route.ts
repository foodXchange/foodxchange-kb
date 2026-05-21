import * as Sentry from "@sentry/nextjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `uploads/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error } = await supabaseAdmin.storage
    .from("kb")
    .upload(filename, Buffer.from(bytes), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    Sentry.captureException(new Error(error.message));
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from("kb").getPublicUrl(filename);

  return Response.json({ url: data.publicUrl });
}
