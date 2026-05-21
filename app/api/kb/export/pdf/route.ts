import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface InlineStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

interface InlineNode {
  type?: string;
  text?: string;
  styles?: InlineStyle;
  href?: string;
  content?: InlineNode[];
}

interface BlockNode {
  type?: string;
  props?: {
    level?: number;
    url?: string;
    caption?: string;
  };
  content?: InlineNode[];
  children?: BlockNode[];
}

function inlineToHtml(nodes: InlineNode[]): string {
  return nodes
    .map((c) => {
      let t = c.text ?? "";
      if (!t) return "";
      if (c.styles?.bold) t = `<strong>${t}</strong>`;
      if (c.styles?.italic) t = `<em>${t}</em>`;
      if (c.styles?.underline) t = `<u>${t}</u>`;
      return t;
    })
    .join("");
}

function blocksToHtml(blocks: unknown[]): string {
  return (blocks as BlockNode[])
    .map((block) => {
      const text = inlineToHtml(block.content ?? []);

      switch (block.type) {
        case "heading": {
          const lv = block.props?.level ?? 1;
          return `<h${lv}>${text}</h${lv}>`;
        }
        case "paragraph":
          return text ? `<p>${text}</p>` : "<br>";
        case "bulletListItem":
          return `<li>${text}</li>`;
        case "numberedListItem":
          return `<li>${text}</li>`;
        case "image":
          return `<img src="${block.props?.url ?? ""}" alt="${block.props?.caption ?? ""}" style="max-width:100%;border-radius:8px;margin:16px 0"/>`;
        case "quote":
          return `<blockquote>${text}</blockquote>`;
        case "code":
          return `<pre><code>${text}</code></pre>`;
        default:
          return text ? `<p>${text}</p>` : "";
      }
    })
    .join("\n");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) return Response.json({ error: "slug required" }, { status: 400 });

  const { data: article } = await supabaseAdmin
    .from("kb_articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!article) return Response.json({ error: "Not found" }, { status: 404 });

  let categoryName = "";
  if (article.category_id) {
    const { data: cat } = await supabaseAdmin
      .from("kb_categories")
      .select("title")
      .eq("id", article.category_id)
      .single();
    categoryName = cat?.title ?? "";
  }

  const updatedAt = new Date(article.updated_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const exportDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const contentHtml = Array.isArray(article.content)
    ? blocksToHtml(article.content)
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${article.title} — FoodXchange KB</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #1e293b;
      line-height: 1.7;
      padding: 48px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 24px;
      border-bottom: 2px solid #f1f5f9;
      margin-bottom: 32px;
    }
    .logo { font-size: 16px; font-weight: 600; color: #0f172a; }
    .logo span { color: #ea580c; margin-left: 4px; }
    .meta { font-size: 12px; color: #94a3b8; text-align: right; }
    h1 {
      font-size: 28px; font-weight: 700; color: #0f172a;
      margin-bottom: 8px; line-height: 1.3;
    }
    .article-meta {
      font-size: 13px; color: #64748b;
      margin-bottom: 32px; padding-bottom: 24px;
      border-bottom: 1px solid #f1f5f9;
    }
    .category-badge {
      display: inline-block;
      background: #fff7ed; color: #ea580c;
      border: 1px solid #fed7aa;
      border-radius: 20px; padding: 2px 10px;
      font-size: 12px; font-weight: 500; margin-right: 8px;
    }
    .content h1 { font-size: 22px; margin: 28px 0 12px; }
    .content h2 { font-size: 18px; margin: 24px 0 10px; color: #1e293b; }
    .content h3 { font-size: 15px; margin: 20px 0 8px; color: #334155; }
    .content p { margin-bottom: 14px; color: #334155; }
    .content ul, .content ol { padding-left: 20px; margin-bottom: 14px; }
    .content li { margin-bottom: 6px; color: #334155; }
    .content blockquote {
      border-left: 3px solid #ea580c;
      padding-left: 16px; color: #64748b;
      font-style: italic; margin: 16px 0;
    }
    .content pre {
      background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 8px; padding: 16px;
      overflow-x: auto; font-family: monospace;
      font-size: 13px; margin: 16px 0;
    }
    .content strong { font-weight: 600; color: #0f172a; }
    .content img { max-width: 100%; border-radius: 8px; margin: 16px 0; }
    .footer {
      margin-top: 48px; padding-top: 24px;
      border-top: 1px solid #f1f5f9;
      display: flex; justify-content: space-between;
      font-size: 11px; color: #94a3b8;
    }
    .print-btn {
      position: fixed; top: 24px; right: 24px;
      background: #ea580c; color: white;
      border: none; border-radius: 8px;
      padding: 10px 20px; font-size: 14px;
      font-weight: 500; cursor: pointer;
      box-shadow: 0 4px 12px rgba(234,88,12,0.3);
    }
    .print-btn:hover { background: #dc4a09; }
    @media print {
      body { padding: 24px; }
      .print-btn { display: none; }
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Save as PDF</button>

  <div class="header">
    <div class="logo">FoodXchange<span>KB</span></div>
    <div class="meta">kb.fdx.trading<br>Exported ${exportDate}</div>
  </div>

  <h1>${article.title}</h1>

  <div class="article-meta">
    ${categoryName ? `<span class="category-badge">${categoryName}</span>` : ""}
    Last updated: ${updatedAt}
  </div>

  <div class="content">
    ${contentHtml}
  </div>

  <div class="footer">
    <span>FoodXchange · fdx.trading</span>
    <span>${article.title} · FoodXchange KB</span>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
