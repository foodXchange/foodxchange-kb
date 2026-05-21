create table if not exists public.kb_changelog (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  title text not null,
  description text,
  type text not null check (
    type in ('feature','fix','improvement','security','breaking','infra')
  ),
  items text[] default '{}',
  author text default 'Udi',
  released_at timestamp default now(),
  created_at timestamp default now()
);

create index if not exists kb_changelog_released_idx
  on public.kb_changelog (released_at desc);

alter table public.kb_changelog
  enable row level security;

-- Seed initial changelog entries
insert into public.kb_changelog
  (version, title, description, type, items, released_at)
values
(
  'v1.8',
  'Knowledge Base launched',
  'Internal KB at kb.fdx.trading',
  'feature',
  array[
    'Standalone Next.js app at kb.fdx.trading',
    'BlockNote rich text editor (Notion-style)',
    'AI writing assistant powered by Anthropic',
    'Image, video, and PDF support via Supabase storage',
    'Full-text search across all articles',
    'Version history for all articles',
    'Article export to PDF',
    'Onboarding tour and tooltip system'
  ],
  now()
),
(
  'v1.7',
  'Match event tracking and admin analytics',
  'Track which portfolio scenarios are shown and clicked',
  'feature',
  array[
    'portfolio_match_events table in Supabase',
    'match_shown event logged on every API call',
    'match_clicked tracked via client session',
    'Per-item analytics: shown + clicked (last 30 days)',
    'Recent match activity feed in admin',
    'Anonymous session ID via localStorage'
  ],
  now() - interval '7 days'
),
(
  'v1.6',
  'Lead capture and email notifications',
  'Full lead pipeline from form to email to Supabase',
  'feature',
  array[
    'sourcing_requests table in Supabase',
    'ContactForm replaces plain contact form',
    'Lead stored with intent JSON and matched slugs',
    'Notification email to info@foodz-x.com via Resend',
    'Buyer confirmation email on submission',
    'Rate limiting: 3 submissions per IP per hour',
    'Lead detail slide-over in admin'
  ],
  now() - interval '14 days'
),
(
  'v1.5',
  'AI matching engine V2',
  'Anthropic Claude parses buyer intent before matching',
  'feature',
  array[
    'lib/ai/intentParser.ts with Anthropic provider',
    'Strict JSON schema validated with Zod',
    'IntentResult: product, packaging, size, market, certs',
    '8-second timeout with heuristic fallback',
    'lib/matching/runMatch.ts extracted for reuse',
    'AI badge shown in MatchingWidget when Anthropic used',
    'Rich intent summary line in widget'
  ],
  now() - interval '21 days'
),
(
  'v1.4',
  'Matching engine V1 and MatchingWidget',
  'Heuristic keyword matching against portfolio scenarios',
  'feature',
  array[
    'lib/matching/heuristicIntentParser.ts',
    'POST /api/match/portfolio — Zod validated',
    'Two-phase Supabase query with GIN index overlap',
    'Scoring: tags +3, formats +4, market +5, PL +4',
    'MatchingWidget client component with 450ms debounce',
    'Added to /en/contact above ContactForm',
    'Disclaimer text consistent with positioning'
  ],
  now() - interval '28 days'
),
(
  'v1.3',
  'Portfolio admin CMS',
  'Full CRUD admin for portfolio scenarios',
  'feature',
  array[
    'Password gate with HMAC cookie signing',
    'proxy.ts middleware protects /admin/* routes',
    '/admin/portfolio — list with search and filters',
    '/admin/portfolio/new and /[id] — create and edit',
    'Server actions with Zod validation',
    'PortfolioForm with ArrayInput chip component',
    'ImageUpload to Supabase storage',
    'AI tag suggestions from content'
  ],
  now() - interval '35 days'
),
(
  'v1.2',
  'Portfolio public pages',
  'Sourcing scenarios live at /en/portfolio',
  'feature',
  array[
    'portfolio_items table with GIN array indexes',
    '/en/portfolio grid with category filter',
    '/en/portfolio/[slug] detail with related items',
    'ISR revalidation every 60 seconds',
    'generateStaticParams for pre-built pages',
    'Metadata chips: markets, formats, certs, tags',
    'Portfolio added to sitemap and navigation'
  ],
  now() - interval '42 days'
),
(
  'v1.1',
  'Newsletter system',
  'Issue management and public display',
  'feature',
  array[
    '/en/newsletter index with issue cards',
    '/en/newsletter/[slug] detail with prev/next nav',
    'ISR revalidation on both pages',
    'Published filter on API route',
    'Newsletter issues added to sitemap',
    'Empty state on index page',
    'Subscribe CTA in footer'
  ],
  now() - interval '49 days'
),
(
  'v1.0',
  'Platform foundation',
  'Initial Next.js app with Supabase and core structure',
  'infra',
  array[
    'Next.js 15 App Router with TypeScript',
    'Tailwind CSS design system',
    'Supabase PostgreSQL database connected',
    'Two Netlify sites: fdx.trading and kb.fdx.trading',
    'Contact card at /c/udi with vCard download',
    'Focus mode layout for contact card pages',
    'robots.txt and sitemap.xml'
  ],
  now() - interval '56 days'
);
