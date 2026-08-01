import { useRef } from "react";

interface CodeBlockViewProps {
  code: string;
  language?: string;
  onChange: (content: { code: string; language?: string }) => void;
  onBackspaceEmpty: () => void;
}

export function CodeBlockView({
  code,
  language,
  onChange,
  onBackspaceEmpty,
}: CodeBlockViewProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  return (
    <div className="border-border bg-muted rounded-md border">
      {language && (
        <div className="border-border text-text-faint border-b px-3 py-1 font-mono text-xs">
          {language}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={code}
        rows={1}
        aria-label="Code block"
        placeholder="Paste or write code…"
        onChange={(e) => {
          autoResize(e.currentTarget);
          onChange({ code: e.target.value, language });
        }}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const el = e.currentTarget;
            const { selectionStart, selectionEnd } = el;
            const next = `${code.slice(0, selectionStart)}\t${code.slice(selectionEnd)}`;
            onChange({ code: next, language });
            requestAnimationFrame(() => {
              el.selectionStart = el.selectionEnd = selectionStart + 1;
            });
          } else if (e.key === "Backspace" && code === "") {
            onBackspaceEmpty();
          }
        }}
        className="text-foreground w-full resize-none bg-transparent px-3 py-2 font-mono text-sm outline-none"
      />
    </div>
  );
}
