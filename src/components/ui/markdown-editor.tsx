"use client";

import { Textarea } from "./textarea";
import { cn } from "@/lib/utils";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeight = "200px",
}: MarkdownEditorProps) {
  const insertText = (before: string, after: string = "") => {
    const textarea = document.activeElement as HTMLTextAreaElement;
    if (!textarea || textarea.tagName !== "TEXTAREA") return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + selected + after;

    onChange(text.substring(0, start) + replacement + text.substring(end));
    
    // Focus back and set selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 0);
  };

  return (
    <div className={cn("flex flex-col rounded-md border border-zinc-800 bg-zinc-950 overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-2 py-1">
        <div className="flex items-center gap-0.5">
          <ToolbarButton onClick={() => insertText("**", "**")} title="Bold">
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => insertText("_", "_")} title="Italic">
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <div className="mx-1 h-4 w-px bg-zinc-800" />
          <ToolbarButton onClick={() => insertText("\n- ")} title="Bullet List">
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => insertText("\n1. ")} title="Numbered List">
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
          <div className="mx-1 h-4 w-px bg-zinc-800" />
          <ToolbarButton onClick={() => insertText("[", "](url)")} title="Link">
            <LinkIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
        <div className="px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
          Markdown
        </div>
      </div>

      {/* Content Area */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full resize-none border-none bg-transparent p-4 text-sm text-zinc-300 shadow-none focus-visible:ring-0"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}

function ToolbarButton({ 
  children, 
  onClick, 
  title 
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
    >
      {children}
    </button>
  );
}
