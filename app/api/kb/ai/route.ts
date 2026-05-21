import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const AISchema = z.object({
  action: z.enum(["write", "improve", "summarize", "suggest-tags", "explain", "chat"]),
  articleTitle: z.string().max(500),
  articleContent: z.string().max(20000).optional(),
  selectedText: z.string().max(5000).optional(),
  userMessage: z.string().min(1).max(2000),
  category: z.string().optional(),
});

const SYSTEM_PROMPT = `You are an AI writing assistant for FoodXchange — a B2B strategic sourcing platform connecting global food manufacturers with Israeli buyers.

You help write and improve knowledge base articles about the platform's features, workflows, database schema, and operational procedures.

FoodXchange positioning:
- Initial fit check only — review internally, follow up if clear fit
- Portfolio scenarios are marketing examples, not a supplier directory
- Not a commitment to availability or pricing

Always write in clear, professional English. Be specific and practical — no vague filler text. Format responses with markdown headings and bullet points when appropriate. Keep responses focused and concise.`;

function buildPrompt(data: z.infer<typeof AISchema>): string {
  const { action, articleTitle, articleContent, selectedText, userMessage, category } = data;

  switch (action) {
    case "write":
      return `Write content for an article titled "${articleTitle}" in the "${category ?? "general"}" category.\nUser request: ${userMessage}\n\nWrite in a clear, structured format with headings. This is for an internal knowledge base.`;

    case "improve":
      return `Improve this text from the article "${articleTitle}":\n\nSELECTED TEXT:\n${selectedText || articleContent || "(no content yet)"}\n\nUser request: ${userMessage}\n\nReturn only the improved version, no explanation.`;

    case "summarize":
      return `Summarize this article content in 2-3 sentences suitable for use as an article excerpt:\n\nTITLE: ${articleTitle}\nCONTENT: ${articleContent ?? "(no content yet)"}`;

    case "suggest-tags":
      return `Suggest 10-15 specific tags for this article. Tags are used for search and categorization.\n\nTITLE: ${articleTitle}\nCONTENT: ${(articleContent ?? "").slice(0, 3000)}\nCATEGORY: ${category ?? "general"}\n\nReturn ONLY a JSON array of strings, no explanation:\n["tag1", "tag2", ...]`;

    case "explain":
      return `Explain this concept clearly for a knowledge base article:\n${userMessage}\n\nContext: This is for the FoodXchange platform KB.\nCurrent article: ${articleTitle}`;

    case "chat":
      return `The user is editing an article titled "${articleTitle}".\nCurrent content summary: ${(articleContent ?? "").slice(0, 500)}\n\nUser question: ${userMessage}\n\nAnswer helpfully and concisely.`;
  }
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "AI not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = AISchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const userPrompt = buildPrompt(parsed.data);

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          Sentry.captureException(err);
          controller.error(new Error("Stream interrupted"));
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    Sentry.captureException(err);
    return Response.json({ error: "AI request failed" }, { status: 500 });
  }
}
