"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { Block } from "@blocknote/core";

interface ArticleContentProps {
  content: unknown;
}

export function ArticleContent({ content }: ArticleContentProps) {
  const editor = useCreateBlockNote({
    initialContent: Array.isArray(content) && content.length > 0
      ? (content as Block[])
      : undefined,
  });

  return <BlockNoteView editor={editor} editable={false} />;
}
