/**
 * seed-kb.ts — Populate FoodXchange KB with all documentation articles.
 * Run from the foodxchange-kb folder:
 *   npx tsx scripts/seed-kb.ts
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// ─── Load .env.local before anything else ─────────────────────────────────────
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌  .env.local not found. Run this script from the foodxchange-kb folder.");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Block helpers ─────────────────────────────────────────────────────────────
type TextNode = { type: "text"; text: string; styles: Record<string, unknown> };
type Block = { id: string; type: string; props: Record<string, unknown>; content: TextNode[]; children: Block[] };

const bp = { textColor: "default", backgroundColor: "default", textAlignment: "left" };
const txt = (text: string): TextNode => ({ type: "text", text, styles: {} });

const h1 = (text: string): Block => ({ id: crypto.randomUUID(), type: "heading",   props: { ...bp, level: 1 }, content: [txt(text)], children: [] });
const h2 = (text: string): Block => ({ id: crypto.randomUUID(), type: "heading",   props: { ...bp, level: 2 }, content: [txt(text)], children: [] });
const p  = (text: string): Block => ({ id: crypto.randomUUID(), type: "paragraph", props: { ...bp },           content: [txt(text)], children: [] });
const li = (text: string): Block => ({ id: crypto.randomUUID(), type: "bulletListItem",   props: { ...bp }, content: [txt(text)], children: [] });
const nl = (text: string): Block => ({ id: crypto.randomUUID(), type: "numberedListItem", props: { ...bp }, content: [txt(text)], children: [] });

function toText(blocks: Block[]): string {
  return blocks.map(b => b.content.map(c => c.text).join("")).join(" ").replace(/\s+/g, " ").trim();
}

// ─── Category lookup ───────────────────────────────────────────────────────────
async function getCats(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("kb_categories").select("id, slug");
  if (error) throw new Error(`Categories fetch failed: ${error.message}`);
  if (!data?.length) throw new Error("No categories found — run the Supabase SQL setup first.");
  console.log(`✓ Categories: ${data.map((c: { slug: string }) => c.slug).join(", ")}\n`);
  return Object.fromEntries(data.map((c: { id: string; slug: string }) => [c.slug, c.id]));
}

// ─── Article builder ───────────────────────────────────────────────────────────
function buildArticles(cats: Record<string, string>) {
  const co = cats["platform-overview"] ?? "";
  const cf = cats["features"] ?? "";
  const cd = cats["database-backend"] ?? "";
  const ca = cats["admin-workflows"] ?? "";
  const cv = cats["developer-guide"] ?? "";
  const cr = cats["roadmap"] ?? "";

  type Article = { title: string; slug: string; category_id: string; status: "published"; display_order: number; content: Block[]; content_text: string };

  function art(title: string, slug: string, cat: string, order: number, blocks: Block[]): Article {
    return { title, slug, category_id: cat, status: "published", display_order: order, content: blocks, content_text: toText(blocks) };
  }

  return [
    // ── PLATFORM OVERVIEW ─────────────────────────────────────────────────────
    art("What is FoodXchange", "what-is-foodxchange", co, 1, [
      h1("What is FoodXchange"),
      p("FoodXchange is a B2B strategic sourcing platform connecting global food manufacturers with Israeli buyers."),
      p("We operate as a sourcing agency — not a marketplace. We review each request internally and follow up only when there is a clear fit."),
      h2("Core positioning"),
      li("Initial fit check only — no live availability data"),
      li("We review internally after each submission"),
      li("Follow up only if there is a clear fit"),
      li("Not a supplier directory — portfolio scenarios are marketing examples"),
      li("Not a commitment to availability or pricing"),
      h2("Who it serves"),
      li("Buyers: Israeli food importers, retailers, foodservice operators"),
      li("Manufacturers: Global food producers seeking Israeli market access"),
      li("The platform bridges the two sides through FoodXchange expertise"),
      h2("How it works"),
      nl("Buyer describes what they need on the contact page"),
      nl("Matching engine shows relevant sourcing scenarios"),
      nl("Buyer submits a formal request"),
      nl("FoodXchange reviews internally"),
      nl("FoodXchange follows up only if there is a clear fit"),
    ]),

    art("Technology Stack", "technology-stack", co, 2, [
      h1("Technology Stack"),
      p("Full stack overview of what powers the FoodXchange platform."),
      h2("Frontend"),
      li("Framework: Next.js 15 with App Router"),
      li("Styling: Tailwind CSS utility-first"),
      li("Language: TypeScript strict mode throughout"),
      li("Deployment: Netlify (two separate sites)"),
      h2("Backend"),
      li("Database: Supabase (PostgreSQL)"),
      li("Storage: Supabase Storage (images, PDFs, files)"),
      li("Auth (admin): Custom HMAC cookie signing"),
      li("Auth (future): Supabase Auth for team access"),
      h2("Third-party services"),
      li("Email: Resend (lead notifications + buyer confirmations)"),
      li("AI: Anthropic Claude claude-sonnet-4 (intent parsing)"),
      li("Analytics: Plausible (contact card page views)"),
      li("DNS + CDN: Netlify (both domains)"),
      h2("Two websites"),
      li("fdx.trading — main public platform (buyers + manufacturers)"),
      li("kb.fdx.trading — this knowledge base (internal, private)"),
      p("Both connect to the SAME Supabase project."),
    ]),

    art("Two Websites Explained", "two-websites-explained", co, 3, [
      h1("Two Websites on One Supabase Project"),
      h2("fdx.trading (main site)"),
      li("Public marketing and sourcing platform"),
      li("Portfolio scenarios: /en/portfolio"),
      li("Newsletter: /en/newsletter"),
      li("Contact + matching: /en/contact"),
      li("Admin CMS: /admin/portfolio"),
      li("Internal tools: /en/admin"),
      li("All buyer-facing features live here"),
      h2("kb.fdx.trading (this site)"),
      li("Private knowledge base — internal documentation only"),
      li("Same Supabase project — can read all tables"),
      li("Netlify site: bright-moxie-adf781.netlify.app"),
      li("Only accessible with ADMIN_PASSWORD"),
      h2("Shared infrastructure"),
      li("Same NEXT_PUBLIC_SUPABASE_URL"),
      li("Same NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      li("Same SUPABASE_SERVICE_ROLE_KEY"),
      li("Different ADMIN_PASSWORD (can be same or different)"),
      li("Different ADMIN_SESSION_SECRET (should be different)"),
      li("Different NEXT_PUBLIC_BASE_URL"),
      h2("Deploying changes"),
      p("Main site: cd into foodxchange folder, run netlify deploy --prod"),
      p("KB site: cd into foodxchange-kb folder, run netlify deploy --prod"),
      p("They deploy independently — changing one never affects the other."),
    ]),

    art("Environment Variables Reference", "environment-variables-reference", co, 4, [
      h1("Environment Variables Reference"),
      p("Complete list of all environment variables used across both sites."),
      h2("Public variables (safe for browser)"),
      p("NEXT_PUBLIC_SUPABASE_URL — Your Supabase project URL. Same for both sites. Found in: Supabase dashboard → Settings → API"),
      p("NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anonymous key. Safe to expose publicly. Used for all public data reads."),
      p("NEXT_PUBLIC_BASE_URL — Production URL. Main site: https://fdx.trading | KB site: https://kb.fdx.trading"),
      p("NEXT_PUBLIC_SITE_NAME — Display name. 'FoodXchange' or 'FoodXchange KB'"),
      h2("Server-only variables (never expose to browser)"),
      p("SUPABASE_SERVICE_ROLE_KEY — Full admin access to Supabase. Bypasses all RLS. NEVER prefix with NEXT_PUBLIC_. NEVER import in client components."),
      p("ADMIN_PASSWORD — Password for the admin gate. Choose a strong password."),
      p("ADMIN_SESSION_SECRET — 32+ character random string used to sign HMAC cookies. Generate with: openssl rand -hex 32. Changing this invalidates all existing sessions."),
      p("ANTHROPIC_API_KEY — Server-only. Used for AI intent parsing. Get from: console.anthropic.com. Set AI_PROVIDER=anthropic to activate."),
      p("AI_PROVIDER — 'anthropic' | 'openai' | 'none'. Defaults to 'none' (uses heuristic parser)."),
      p("RESEND_API_KEY — Server-only. Used for email notifications. Get from: resend.com"),
      p("NOTIFY_EMAIL_TO — Email address that receives lead notifications. Currently: info@foodz-x.com"),
      p("NOTIFY_EMAIL_FROM — Sender address. Must be verified in Resend. Currently: info@foodz-x.com"),
    ]),

    // ── FEATURES ──────────────────────────────────────────────────────────────
    art("Portfolio System", "portfolio-system", cf, 1, [
      h1("Portfolio System"),
      h2("What it is"),
      p("Public-facing sourcing scenarios at /en/portfolio. These are marketing examples of past sourcing work, not a live supplier directory."),
      h2("Public pages"),
      p("/en/portfolio — grid of all published scenarios. Category filter buttons (client-side, no API call). Each card shows: image, category, title, summary."),
      p("/en/portfolio/[slug] — individual scenario detail. Hero image, full content, metadata chips. Markets, formats, certifications, tags shown as chips. Related scenarios section. CTA: Start a conversation."),
      h2("Admin pages (requires login)"),
      p("/admin/portfolio — list of all scenarios. Shows: title, slug, category, status, priority, date. Actions: edit, publish/unpublish, delete. Recent match activity and sourcing requests sections."),
      p("/admin/portfolio/new — create new scenario"),
      p("/admin/portfolio/[id] — edit existing. Analytics: times shown + clicked in last 30 days. Full form with all fields."),
      h2("How to publish a new scenario"),
      nl("Go to /admin/portfolio → New item"),
      nl("Fill in title (slug auto-generates)"),
      nl("Select or type category"),
      nl("Write summary (2-3 sentences for the grid card)"),
      nl("Write full HTML content (300-500 words)"),
      nl("Upload hero image or paste URL"),
      nl("Fill array fields — TAGS ARE MOST IMPORTANT for matching"),
      nl("Set priority (0-100, higher = shown first)"),
      nl("Toggle Published = true"),
      nl("Save — appears on site within 60 seconds"),
      h2("Tag quality matters"),
      p("Tags power the matching engine. Bad tags = bad matches."),
      p("Good tags: 'tomato paste', '115g cup', 'kosher certified', 'retail pack'"),
      p("Bad tags: 'food', 'product', 'quality' (too generic)"),
      p("Aim for 10-15 specific tags per scenario."),
    ]),

    art("Matching Engine", "matching-engine", cf, 2, [
      h1("Matching Engine"),
      h2("What it does"),
      p("When a buyer types a description of what they need, the matching engine finds relevant portfolio scenarios. It has two layers: V1 heuristic and V2 AI-powered."),
      h2("V1 — Heuristic parser (always available)"),
      p("lib/matching/heuristicIntentParser.ts"),
      li("Splits text into keywords, removes stopwords"),
      li("Detects packaging terms (cup, jar, pouch, 115g, etc.)"),
      li("Detects certification terms (kosher, halal, organic, etc.)"),
      li("Detects market terms (retail, foodservice, etc.)"),
      li("Detects private label intent"),
      p("No API keys required. Always works."),
      h2("V2 — AI parser (requires Anthropic key)"),
      p("lib/ai/intentParser.ts"),
      li("Calls Anthropic Claude with strict JSON schema"),
      li("Returns structured IntentResult with confidence scores"),
      li("Extracts: product, packaging, size, market, certs, country preferences, private label, kosher flag"),
      li("Falls back to V1 automatically if AI fails or times out"),
      p("Activate by setting AI_PROVIDER=anthropic in env vars."),
      h2("Scoring weights"),
      li("Tag keyword match: +3 per hit"),
      li("Title keyword match: +2 per hit"),
      li("Format/packaging match: +4 per hit"),
      li("Certification match: +3 per hit"),
      li("Market match: +5"),
      li("Private label match: +4"),
      li("Product name in title: +5"),
      li("Country preference match: +2"),
      li("Priority tie-breaker: priority × 0.25"),
      h2("API endpoint"),
      p("POST /api/match/portfolio"),
      p("Input: { text, market, privateLabel, limit }"),
      p("Output: { intent, results, parsed_by, total }"),
      p("Results include score but score is NOT shown to buyers."),
      h2("Where the widget appears"),
      li("/en/contact — above the contact form"),
      li("Debounced 450ms — searches as buyer types"),
      li("Shows intent summary line + AI badge if Anthropic used"),
      li("Disclaimer: 'These are examples. We review internally.'"),
    ]),

    art("Lead Capture System", "lead-capture-system", cf, 3, [
      h1("Lead Capture System"),
      h2("Flow overview"),
      nl("Buyer fills ContactForm on /en/contact"),
      nl("Form POSTs to /api/lead/submit"),
      nl("Server validates with Zod"),
      nl("Server checks rate limit (3 per IP per hour)"),
      nl("Server runs matching engine (top 3 matches)"),
      nl("Server stores to sourcing_requests in Supabase"),
      nl("Server sends notification email to info@foodz-x.com"),
      nl("Server sends confirmation email to buyer"),
      nl("Server returns matched scenarios to client"),
      nl("Form shows thank you screen with matched scenarios"),
      h2("What gets stored (sourcing_requests table)"),
      li("name, email, company"),
      li("message (raw free text)"),
      li("market, private_label (optional explicit filters)"),
      li("intent_json (full AI-parsed intent object)"),
      li("matched_slugs (top 3 portfolio slugs at submission time)"),
      li("created_at"),
      h2("Notification email"),
      p("Sent to: NOTIFY_EMAIL_TO (info@foodz-x.com)"),
      p("Contains: name, email, company, message, parsed intent summary, matched scenario links"),
      h2("Buyer confirmation email"),
      p("Sent to: the buyer's email address"),
      p("Contains: receipt message, intent summary, related scenario links, contact info"),
      p("Sets expectation: 'follow up only if clear fit'"),
      h2("Rate limiting"),
      p("3 submissions per IP per hour (in-memory). Returns HTTP 429 with retry time if exceeded."),
      h2("Reviewing leads in admin"),
      p("Go to /admin/portfolio → scroll to Recent sourcing requests. Click any row to open slide-over panel with full details."),
    ]),

    art("Newsletter System", "newsletter-system", cf, 4, [
      h1("Newsletter System"),
      h2("Public pages"),
      p("/en/newsletter — list of all published issues. Grid layout, one card per issue. Each card: cover image, title, date, excerpt."),
      p("/en/newsletter/[slug] — individual issue. Hero section, cover image, full HTML content. Prev/next navigation. Subscribe CTA in footer."),
      h2("Admin"),
      p("/en/admin/newsletter-builder — write and manage issues"),
      p("/en/admin/upload — upload cover images"),
      h2("How to publish a new issue"),
      nl("Go to /en/admin/newsletter-builder"),
      nl("Create new issue or select existing"),
      nl("Write content using the editor"),
      nl("Upload cover image via /en/admin/upload"),
      nl("Set published = true"),
      nl("Issue appears on /en/newsletter within 60 seconds"),
      h2("Issue structure"),
      p("Each issue has: title, slug, excerpt, content (HTML), cover_image URL, category, published flag, created_at. Slug is used in the URL: /en/newsletter/[slug]."),
      h2("ISR revalidation"),
      p("Both newsletter pages have: export const revalidate = 60"),
      p("New issues appear automatically within 60 seconds. No redeploy needed when publishing."),
    ]),

    art("Contact Card System", "contact-card-system", cf, 5, [
      h1("Contact Card System (/c/[handle])"),
      h2("What it is"),
      p("Digital business card pages accessible at /c/[handle]. Example: /c/udi for the founder's card. Focus mode — no header or footer from the main site."),
      h2("Features"),
      li("Founder photo with initials fallback"),
      li("WhatsApp buttons (buyer + manufacturer)"),
      li("Email, website, LinkedIn buttons"),
      li("Save contact (downloads .vcf vCard file)"),
      li("QR code with copy link + share button"),
      li("Plausible analytics tracking"),
      h2("Focus mode layout"),
      p("Lives in app/(contact)/c/[handle]/page.tsx"),
      p("Uses app/(contact)/layout.tsx — minimal, no nav"),
      p("URL remains /c/[handle] — route group doesn't change URL"),
      h2("Adding a new handle"),
      nl("Open lib/contactCards.ts"),
      nl("Add new entry to the cards object: { handle, name, title, company, tagline, whatsappBuyer, whatsappManufacturer, email, website, linkedin, imageUrl }"),
      nl("Place photo at public/[filename].jpeg"),
      nl("Deploy — new card available at /c/[handle]"),
      h2("vCard download"),
      p("/api/vcard/[handle] returns a .vcf file. Generated from lib/vcard.ts. 'Save Contact' button downloads this file and adds the contact to phone/email address book."),
    ]),

    // ── DATABASE & BACKEND ────────────────────────────────────────────────────
    art("Supabase Overview", "supabase-overview", cd, 1, [
      h1("Supabase Overview"),
      h2("Project details"),
      p("Both websites (fdx.trading and kb.fdx.trading) connect to the SAME Supabase project. URL: stored in NEXT_PUBLIC_SUPABASE_URL env var."),
      h2("Two clients — never mix them"),
      p("lib/supabase.ts — anon key, public reads. Used in server components and API routes for reading published data. Safe to use in any file."),
      p("lib/supabaseAdmin.ts — service role key, full access. Used for all writes and admin reads. NEVER import in client components. NEVER use in files that run in the browser."),
      h2("Tables overview"),
      li("portfolio_items — sourcing scenarios (public read)"),
      li("newsletter_issues — newsletter content (public read)"),
      li("sourcing_requests — lead capture (insert only, no public read)"),
      li("portfolio_match_events — analytics (insert only, no public read)"),
      li("kb_categories — KB structure (public read)"),
      li("kb_articles — KB content (private, auth required)"),
      h2("RLS (Row Level Security)"),
      p("All tables have RLS enabled."),
      li("Public tables: anon key can SELECT published=true rows only"),
      li("Private tables: anon key can INSERT only (no SELECT)"),
      li("Admin: service role bypasses RLS completely"),
      h2("Auto-updated timestamps"),
      p("portfolio_items and kb_articles both have triggers that automatically set updated_at = now() on every UPDATE. Do not manually set updated_at in your queries."),
    ]),

    art("Database Schema — All Tables", "database-schema-all-tables", cd, 2, [
      h1("Database Schema — All Tables"),
      h2("portfolio_items"),
      p("The core table for sourcing scenarios."),
      p("id (uuid PK), title, slug (unique), summary, content, category, markets[], private_label, formats[], certifications[], countries[], tags[], hero_image, priority (int 0-100), published, created_at, updated_at"),
      p("Key indexes: portfolio_published_priority_idx (published, priority, created_at), portfolio_category_idx (category), GIN indexes for array overlap queries on markets, formats, tags."),
      h2("newsletter_issues"),
      p("id (uuid PK), slug (unique), title, excerpt, content, cover_image, category, published, created_at"),
      h2("sourcing_requests"),
      p("Lead capture. Never exposed publicly."),
      p("id (uuid PK), name, email, company, message, market, private_label, intent_json (jsonb), matched_slugs (text[]), created_at"),
      h2("portfolio_match_events"),
      p("Analytics. Never exposed publicly."),
      p("id (uuid PK), event_type (match_shown/match_clicked), query_text, intent_json, shown_slugs (text[]), clicked_slug, page_path, session_id, created_at"),
      h2("kb_categories"),
      p("id (uuid PK), title, slug (unique), icon, description, parent_id (self-reference), display_order, created_at"),
      h2("kb_articles"),
      p("id (uuid PK), title, slug (unique), content (jsonb), content_text (plain text for search), category_id (FK → kb_categories), status (draft/published), cover_image, display_order, search_vector (tsvector generated column), created_at, updated_at"),
    ]),

    art("Netlify Configuration", "netlify-configuration", cd, 3, [
      h1("Netlify Configuration — Both Sites"),
      h2("Main site (fdx.trading)"),
      p("Custom domain: fdx.trading"),
      p("Build command: next build | Publish directory: .next | Plugin: @netlify/plugin-nextjs"),
      h2("KB site (kb.fdx.trading)"),
      p("Netlify project: bright-moxie-adf781 | Custom domain: kb.fdx.trading"),
      p("Build command: next build | Publish directory: .next | Plugin: @netlify/plugin-nextjs"),
      p("No middleware.ts — removed to fix edge function bundling. Auth handled by requireAuth() in each page instead."),
      h2("Environment variables"),
      p("Both sites need their own env vars set in Netlify: Site → Site configuration → Environment variables"),
      p("Local: .env.local file in each project folder (never committed to git)"),
      h2("Deploying"),
      p("From terminal in each project folder:"),
      li("netlify link --id [project-id]"),
      li("netlify deploy --prod"),
      p("KB site project ID: b3c3850e-452c-4abf-85e6-e353f1e6250d"),
      h2("DNS"),
      p("Both domains managed in Netlify DNS. fdx.trading — primary domain. kb.fdx.trading — CNAME pointing to KB Netlify app. SSL certificates auto-provisioned by Netlify."),
    ]),

    // ── ADMIN WORKFLOWS ───────────────────────────────────────────────────────
    art("How to Use This Knowledge Base", "how-to-use-this-knowledge-base", ca, 1, [
      h1("How to Use This Knowledge Base"),
      h2("Navigation"),
      p("Left sidebar: all categories and articles. Click a category name to expand/collapse it. Click an article title to read it. Orange left border = currently viewing that article."),
      h2("Creating a new article"),
      p("Click '+ New article' at the bottom of the sidebar, OR '+ Add first article' under any category, OR 'New article' button on the dashboard."),
      h2("Writing an article"),
      p("The editor works like Notion. Click anywhere to start typing. Type / to see a menu of block types: Heading 1-3, Paragraph, Bullet list, Numbered list, Image, Video, File, Quote, Code block."),
      h2("Adding images"),
      p("Option A — drag and drop: Drag any image file onto the editor. It uploads automatically to Supabase storage."),
      p("Option B — image block: Type /image in the editor. Click 'Upload image' or paste an image URL."),
      p("Option C — paste: Copy an image to clipboard, paste into editor."),
      h2("Adding videos"),
      p("Type /video in the editor. Paste a YouTube, Loom, or Vimeo URL. The video embeds inline. No file upload needed — videos stream from their source."),
      h2("Adding PDF files"),
      p("Type /file in the editor. Click 'Upload file' and select your PDF. It uploads to Supabase storage. Readers can click to download or open the PDF."),
      h2("Auto-save"),
      p("The editor auto-saves every 1.5 seconds after you stop typing. Watch the top bar — it shows 'Saving...' then 'Saved [time]'. You never need to manually save."),
      h2("Publishing an article"),
      p("Toggle 'Published' to ON in the top bar. Published articles appear in search results. Draft articles are only visible to you."),
      h2("Article status"),
      li("Draft — saved but not published (gray dot in sidebar)"),
      li("Published — live and searchable (green dot in sidebar)"),
      h2("Search"),
      p("Click the search bar at the top (or press Ctrl+K / Cmd+K). Search queries the full text of all published articles. Results ranked by relevance using PostgreSQL full-text search."),
    ]),

    art("How to Review and Respond to Leads", "how-to-review-leads", ca, 2, [
      h1("How to Review and Respond to Leads"),
      h2("Where leads come from"),
      p("Buyers submit the contact form at fdx.trading/en/contact. The matching engine runs automatically on their message. Top 3 matching scenarios are stored with the lead."),
      h2("Getting notified"),
      p("Email arrives at info@foodz-x.com immediately on submission."),
      p("Subject: 'New sourcing request — [name] ([company])'"),
      p("Email contains: full message, parsed intent, matched scenarios."),
      h2("Reviewing in admin"),
      nl("Go to fdx.trading/admin/portfolio"),
      nl("Scroll down to 'Recent sourcing requests'"),
      nl("Click any row to open the detail slide-over"),
      nl("Review: full message, intent fields, matched scenarios"),
      nl("Click the email button to open a reply directly"),
      h2("Decision framework"),
      p("Follow up if:"),
      li("Product category is one we actively source"),
      li("Volume is commercially meaningful"),
      li("Buyer seems serious (complete details provided)"),
      li("Matched scenarios have high relevance"),
      p("Pass if:"),
      li("Outside current category focus"),
      li("Vague or incomplete request"),
      li("Volume too small for sourcing effort"),
      h2("Response tone"),
      p("Always reference the specific product they mentioned. Never promise supplier availability. Invite them to provide more spec details if unclear."),
      p("Timeline: 'We will follow up within 1-2 business days if there is a fit'"),
    ]),

    // ── DEVELOPER GUIDE ───────────────────────────────────────────────────────
    art("Adding a New Page", "adding-a-new-page", cv, 1, [
      h1("How to Add a New Page (fdx.trading)"),
      h2("Step by step"),
      nl("Create file: app/en/[pagename]/page.tsx"),
      nl("Make it an async server component (no 'use client')"),
      nl("Add at top: export const revalidate = 60"),
      nl("Use supabase from lib/supabase.ts for data"),
      nl("Add generateMetadata for SEO"),
      nl("Add URL to app/sitemap.xml/route.ts"),
      nl("Add nav link in components/Header.tsx"),
      nl("Deploy: netlify deploy --prod"),
      h2("Template"),
      p("import { supabase } from '@/lib/supabase';"),
      p("export const revalidate = 60;"),
      p("export async function generateMetadata() { return { title: 'Page Title | FoodXchange', description: '...', alternates: { canonical: 'https://fdx.trading/en/[page]' } }; }"),
      p("export default async function PageName() { const { data } = await supabase.from('your_table').select('field1, field2').eq('published', true); return <main>...</main>; }"),
      h2("Rules"),
      li("Always add .eq('published', true) on public queries"),
      li("Always use supabase (anon key) not supabaseAdmin on pages"),
      li("Never use 'use client' on a page that fetches data"),
      li("If you need interactivity, create a separate client component and import it into the server page"),
    ]),

    art("Security Rules for Developers", "security-rules-for-developers", cv, 2, [
      h1("Security Rules for Developers"),
      p("Read this before touching any file in the project."),
      h2("The most important rule"),
      p("supabaseAdmin (service role key) must NEVER appear in any file that contains 'use client' at the top."),
      p("If a file has 'use client' → it runs in the browser. If it runs in the browser → the service role key is exposed. Service role key bypasses ALL security → full DB access."),
      h2("Two clients, two contexts"),
      p("supabase.ts → anon key → browser-safe → public reads only"),
      p("supabaseAdmin.ts → service role → server only → full access"),
      p("Where supabaseAdmin IS allowed:"),
      li("lib/supabaseAdmin.ts (definition)"),
      li("app/admin/portfolio/actions.ts (server actions)"),
      li("Any app/api/*/route.ts file"),
      li("Any server component (no 'use client')"),
      p("Where supabaseAdmin is NEVER allowed:"),
      li("Any file with 'use client' at top"),
      li("components/*.tsx that have 'use client'"),
      li("Any file imported by a client component"),
      h2("Environment variable rules"),
      p("NEXT_PUBLIC_ prefix = visible to everyone in the browser"),
      p("Never use NEXT_PUBLIC_ for: SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD, ADMIN_SESSION_SECRET, ANTHROPIC_API_KEY, RESEND_API_KEY"),
      h2("Admin route protection"),
      p("Main site: proxy.ts (middleware) protects /admin/*"),
      p("KB site: requireAuth() called at top of each page"),
      p("Both use HMAC-signed httpOnly cookies. Never return the raw ADMIN_PASSWORD to the client. Never log secrets to console in production."),
    ]),

    // ── ROADMAP ───────────────────────────────────────────────────────────────
    art("Current Platform Status", "current-platform-status", cr, 1, [
      h1("Current Platform Status — May 2026"),
      h2("Live features"),
      li("Newsletter system — issues list + detail pages"),
      li("Contact card — /c/udi with vCard download"),
      li("Portfolio public pages — grid + detail + category filter"),
      li("Portfolio admin — full CRUD with password gate"),
      li("Matching engine V1 — heuristic keyword matching"),
      li("Matching engine V2 — Anthropic AI intent parsing"),
      li("Lead capture — Supabase + email notifications"),
      li("Buyer confirmation emails"),
      li("Match event tracking — shown + clicked analytics"),
      li("Admin analytics — per-item 30-day stats"),
      li("Rate limiting on lead submission"),
      li("robots.txt blocking admin + API routes"),
      li("Sitemap covering all public pages"),
      li("Knowledge base — kb.fdx.trading"),
      h2("In progress"),
      li("Portfolio content — scenarios need real content + images"),
      li("KB population — adding all documentation"),
      h2("Known gaps"),
      li("No OG images for portfolio items yet"),
      li("Newsletter email sending not built (only manages issues)"),
      li("Image upload in portfolio admin needs Supabase bucket setup"),
      li("Rate limit is in-memory (resets on cold starts)"),
    ]),

    art("Next Development Stages", "next-development-stages", cr, 2, [
      h1("Next Development Stages"),
      h2("Stage 1 — Content quality (now)"),
      p("No code needed. Just content work."),
      li("Write real content for all portfolio scenarios"),
      li("Upload proper hero images for all items"),
      li("Add 10-15 specific tags per scenario"),
      li("Fill all array fields: markets, formats, certs, countries"),
      li("Publish Issue 2 of the newsletter"),
      h2("Stage 2 — Conversion (1-2 months)"),
      li("OG images for portfolio items (opengraph-image.tsx)"),
      li("WhatsApp button on ContactForm success screen"),
      li("Portfolio detail two-column layout with sticky sidebar"),
      li("JSON-LD structured data on portfolio + newsletter pages"),
      li("Key facts strip in portfolio hero section"),
      h2("Stage 3 — Intelligence (2-4 months)"),
      li("Matching V3 — confidence-weighted scoring"),
      li("AI tag suggestions in portfolio admin"),
      li("Structured intake form fields alongside free text"),
      li("Supplier-side private profiles (internal reference)"),
      h2("Stage 4 — Scale (4-6 months)"),
      li("Supabase connection pooling (transaction pooler port 6543)"),
      li("Error monitoring (Sentry integration)"),
      li("Health check endpoint at /api/health"),
      li("Persistent rate limiting (Upstash Redis)"),
      li("Newsletter email delivery system"),
      h2("Stage 5 — Product expansion (6+ months)"),
      li("Manufacturer portal (authenticated supplier area)"),
      li("Buyer portal (track requests and sourcing status)"),
      li("RFQ system (structured request-for-quote flow)"),
      li("Analytics dashboard for match performance"),
      li("Hebrew RTL version of the platform"),
    ]),
  ];
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱  FoodXchange KB Seed\n" + "─".repeat(50));

  const cats = await getCats();
  const missing = ["platform-overview","features","database-backend","admin-workflows","developer-guide","roadmap"]
    .filter(s => !cats[s]);
  if (missing.length) {
    console.error(`❌  Missing categories: ${missing.join(", ")}`);
    console.error("    Run the Supabase SQL setup and add these category slugs first.");
    process.exit(1);
  }

  // Delete all existing articles
  const { error: delErr } = await supabase
    .from("kb_articles")
    .delete()
    .not("id", "is", null);
  if (delErr) { console.error("❌  Clear failed:", delErr.message); process.exit(1); }
  console.log("✓  Cleared existing articles\n");

  const articles = buildArticles(cats);
  let ok = 0;
  let fail = 0;

  for (const article of articles) {
    process.stdout.write(`   ${article.title}... `);
    const { error } = await supabase
      .from("kb_articles")
      .upsert(article, { onConflict: "slug", ignoreDuplicates: false });
    if (error) {
      console.log(`❌  ${error.message}`);
      fail++;
    } else {
      console.log("✓");
      ok++;
    }
  }

  console.log("\n" + "─".repeat(50));
  console.log(`📊  ${ok} inserted, ${fail} failed`);

  const { count } = await supabase
    .from("kb_articles")
    .select("*", { count: "exact", head: true });
  console.log(`✓   Total in database: ${count} articles`);

  if (fail > 0) process.exit(1);
}

main().catch(e => { console.error("❌  Fatal:", e); process.exit(1); });
