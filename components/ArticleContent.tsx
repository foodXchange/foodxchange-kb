"use client";

import { useEffect, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { Block } from "@blocknote/core";

interface Heading {
  text: string;
  anchor: string;
  level: number;
}

interface ArticleContentProps {
  content: unknown;
  headings?: Heading[];
}

export function ArticleContent({ content, headings }: ArticleContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useCreateBlockNote({
    initialContent: Array.isArray(content) && content.length > 0
      ? (content as Block[])
      : undefined,
  });

  // Inject id attributes into rendered heading elements for TOC anchor links
  useEffect(() => {
    if (!containerRef.current || !headings?.length) return;
    const els = containerRef.current.querySelectorAll("h1, h2, h3, h4, h5, h6");
    els.forEach((el) => {
      const text = el.textContent ?? "";
      const anchor = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (anchor) el.id = anchor;
    });
  });

  return (
    <div ref={containerRef}>
      <BlockNoteView editor={editor} editable={false} />
    </div>
  );
}
