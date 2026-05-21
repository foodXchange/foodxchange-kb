"use client";

import { useRef, useState } from "react";

interface TooltipProps {
  content: string;
  shortcut?: string;
  position?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const positionClasses: Record<string, string> = {
  top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left:   "right-full top-1/2 -translate-y-1/2 mr-2",
  right:  "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowClasses: Record<string, string> = {
  top:    "top-full left-1/2 -translate-x-1/2 -mt-1 border-r border-b",
  bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l border-t",
  left:   "left-full top-1/2 -translate-y-1/2 -ml-1 border-t border-r",
  right:  "right-full top-1/2 -translate-y-1/2 -mr-1 border-b border-l",
};

export function Tooltip({
  content,
  shortcut,
  position = "top",
  children,
  delay = 600,
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleEnter() {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }

  function handleLeave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }

  return (
    <div
      className={`relative inline-flex ${className ?? ""}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-50 pointer-events-none bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap border border-white/10 flex items-center gap-2 ${positionClasses[position]}`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="bg-white/10 rounded px-1.5 py-0.5 text-slate-300 font-mono text-[10px]">
              {shortcut}
            </kbd>
          )}
          <div
            className={`absolute w-2 h-2 bg-slate-800 border-white/10 rotate-45 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}
