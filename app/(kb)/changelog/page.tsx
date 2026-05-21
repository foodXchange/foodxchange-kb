import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth } from "@/lib/requireAuth";
import { ChangelogView } from "@/components/kb/ChangelogView";

export const metadata: Metadata = {
  title: "Changelog | FoodXchange KB",
};

export default async function ChangelogPage() {
  await requireAuth();

  const { data } = await supabaseAdmin
    .from("kb_changelog")
    .select("*")
    .order("released_at", { ascending: false });

  return <ChangelogView entries={data ?? []} />;
}
