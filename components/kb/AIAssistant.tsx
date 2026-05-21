"use client";

import { useRef, useState } from "react";

type Action = "write" | "improve" | "summarize" | "suggest-tags" | "explain" | "chat";

interface Message {
  role: "user" | "assistant";
  content: string;
  action?: Action;
}

interface AIAssistantProps {
  articleTitle: string;
  articleContent: string;
  category: string;
  onInsert: (text: string) => void;
  onClose: () => void;
}

const ACTIONS: { id: Action; label: string; icon: string; placeholder: string }[] = [
  { id: "chat",         label: "Chat",      icon: "💬", placeholder: "Ask anything about this article…" },
  { id: "write",        label: "Write",     icon: "✍️", placeholder: "Describe what content to write…" },
  { id: "improve",      label: "Improve",   icon: "✨", placeholder: "Describe how to improve the text…" },
  { id: "summarize",    label: "Summarize", icon: "📝", placeholder: "Click Send to summarize this article" },
  { id: "suggest-tags", label: "Tags",      icon: "🏷", placeholder: "Click Send to suggest tags" },
  { id: "explain",      label: "Explain",   icon: "💡", placeholder: "What concept should be explained…" },
];

const SUGGESTIONS = [
  { label: "Write an introduction", action: "write" as Action,     message: "Write an introduction section for this article." },
  { label: "Suggest tags",          action: "suggest-tags" as Action, message: "suggest-tags" },
  { label: "Improve opening",       action: "improve" as Action,   message: "Improve the opening paragraph to be more engaging." },
  { label: "Summarize article",     action: "summarize" as Action, message: "summarize" },
];

function renderMessage(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <span key={i}>
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**"))
            return <strong key={j} className="text-white font-medium">{part.slice(2, -2)}</strong>;
          if (part.startsWith("`") && part.endsWith("`"))
            return <code key={j} className="bg-white/10 px-1 py-0.5 rounded text-xs">{part.slice(1, -1)}</code>;
          return <span key={j}>{part}</span>;
        })}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    );
  });
}

function parseTags(content: string): string[] | null {
  try {
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed) && parsed.every(t => typeof t === "string")) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function AIAssistant({ articleTitle, articleContent, category, onInsert, onClose }: AIAssistantProps) {
  const [action, setAction] = useState<Action>("chat");
  const [userMessage, setUserMessage] = useState("");
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentAction = ACTIONS.find(a => a.id === action)!;
  const noInputNeeded = action === "summarize" || action === "suggest-tags";
  const lastAssistant = [...history].reverse().find(m => m.role === "assistant");

  function scrollToBottom() {
    setTimeout(() => {
      if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }, 50);
  }

  async function sendMessage(overrideMessage?: string, overrideAction?: Action) {
    const msg = overrideMessage ?? userMessage;
    const act = overrideAction ?? action;
    if (!msg.trim() && !["summarize", "suggest-tags"].includes(act)) return;

    setLoading(true);
    setError(null);

    const userMsg: Message = { role: "user", content: msg || `[${act}]`, action: act };
    setHistory(h => [...h, userMsg]);
    setUserMessage("");
    scrollToBottom();

    let fullResponse = "";

    try {
      const res = await fetch("/api/kb/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: act,
          articleTitle,
          articleContent: articleContent.slice(0, 10000),
          userMessage: msg || act,
          category,
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        if (res.status === 503) {
          throw new Error("AI assistant not configured. Add ANTHROPIC_API_KEY to environment variables.");
        }
        throw new Error(err.error ?? "AI request failed");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      setHistory(h => [...h, { role: "assistant", content: "", action: act }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += decoder.decode(value, { stream: true });
        setHistory(h => [
          ...h.slice(0, -1),
          { role: "assistant", content: fullResponse, action: act },
        ]);
        scrollToBottom();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setHistory(h => h.at(-1)?.role === "assistant" ? h.slice(0, -1) : h);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="w-96 flex-shrink-0 flex flex-col bg-slate-900 border-l border-white/10 ai-panel">
      {/* Header */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
        <span className="text-white font-medium text-sm flex items-center gap-2">
          <span className="text-orange-400">✦</span>
          AI Assistant
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition text-lg leading-none"
          aria-label="Close AI Assistant"
        >
          ×
        </button>
      </div>

      {/* Action pills */}
      <div className="px-4 py-3 border-b border-white/10 flex gap-2 overflow-x-auto flex-shrink-0">
        {ACTIONS.map(a => (
          <button
            key={a.id}
            onClick={() => setAction(a.id)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition ${
              action === a.id
                ? "bg-orange-500 text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {/* History */}
      <div ref={historyRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {history.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center pt-8">
            <span className="text-orange-400 text-3xl mb-3">✦</span>
            <p className="text-slate-500 text-sm">Ask me anything about this article</p>
            <div className="flex flex-wrap gap-2 mt-5 justify-center">
              {SUGGESTIONS.map(s => (
                <button
                  key={s.label}
                  onClick={() => {
                    setAction(s.action);
                    sendMessage(s.message, s.action);
                  }}
                  className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-full transition"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          history.map((msg, i) => (
            <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
              {msg.role === "user" ? (
                <div className="ml-8 bg-white/10 rounded-xl rounded-tr-sm px-4 py-3 text-sm text-white max-w-full">
                  {msg.content === `[${msg.action}]` ? (
                    <span className="text-slate-400 italic">{ACTIONS.find(a => a.id === msg.action)?.label}…</span>
                  ) : msg.content}
                </div>
              ) : (
                <div className={`mr-8 max-w-full rounded-xl rounded-tl-sm px-4 py-3 text-sm text-slate-200 leading-relaxed bg-orange-500/10 border border-orange-500/20 ai-response ${
                  loading && i === history.length - 1 && !msg.content ? "ai-cursor" : ""
                } ${loading && i === history.length - 1 ? "ai-cursor" : ""}`}>
                  {msg.action === "suggest-tags" && msg.content ? (
                    (() => {
                      const tags = parseTags(msg.content);
                      return tags ? (
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => onInsert(tag)}
                              className="bg-slate-700 hover:bg-orange-500 text-slate-200 hover:text-white rounded-full px-3 py-1 text-xs cursor-pointer transition"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className={loading && i === history.length - 1 ? "ai-cursor" : ""}>
                          {renderMessage(msg.content)}
                        </span>
                      );
                    })()
                  ) : (
                    <span>
                      {renderMessage(msg.content)}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-xs flex items-start gap-2">
            <span className="flex-shrink-0">⚠</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 p-4 flex-shrink-0">
        <p className="text-xs text-slate-500 mb-2">{currentAction.placeholder}</p>
        <textarea
          ref={textareaRef}
          rows={3}
          value={userMessage}
          onChange={e => setUserMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={noInputNeeded ? "" : currentAction.placeholder}
          disabled={loading}
          className="bg-white/5 border border-white/10 rounded-xl text-white text-sm px-4 py-3 w-full resize-none focus:outline-none focus:border-orange-500/50 placeholder:text-slate-600 disabled:opacity-50"
        />
        <div className="flex gap-2 mt-3 items-center">
          <button
            onClick={() => sendMessage()}
            disabled={loading || (!userMessage.trim() && !noInputNeeded)}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating…" : "Send ↑"}
          </button>
          {lastAssistant?.content && !loading && (
            <button
              onClick={() => onInsert(lastAssistant.content)}
              className="bg-white/10 hover:bg-white/20 text-slate-300 text-sm py-2 px-3 rounded-lg transition whitespace-nowrap"
            >
              Insert
            </button>
          )}
          {history.length > 0 && !loading && (
            <button
              onClick={() => { setHistory([]); setError(null); }}
              className="text-slate-500 hover:text-slate-400 text-xs transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
