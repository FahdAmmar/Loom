import { useEffect, useRef, useState } from "react";
import { Sigma } from "lucide-react";

import { useT } from "@/i18n/useT";
import { renderMath, type MathResult } from "@/lib/renderMath";

interface MathBlockViewProps {
  latex: string;
  onChange: (content: { latex: string }) => void;
  onBackspaceEmpty: () => void;
}

export function MathBlockView({ latex, onChange, onBackspaceEmpty }: MathBlockViewProps) {
  const t = useT();
  const [isEditing, setEditing] = useState(latex === "");
  const [result, setResult] = useState<MathResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    renderMath(latex)
      .then((next) => !cancelled && setResult(next))
      .catch(() => !cancelled && setResult({ ok: false, error: t("math.loadFailed") }));
    return () => {
      cancelled = true;
    };
  }, [latex, t]);

  useEffect(() => {
    if (isEditing) textareaRef.current?.focus();
  }, [isEditing]);

  return (
    <div className="border-border bg-muted/40 w-full rounded-md border">
      {result?.ok && result.html !== "" && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={t("math.edit")}
          className="hover:bg-accent/50 w-full overflow-x-auto px-3 py-2 text-center"
          dir="ltr"
          // Sanitized in renderMath; KaTeX output is markup, not text.
          dangerouslySetInnerHTML={{ __html: result.html }}
        />
      )}

      {result && !result.ok && !isEditing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={t("math.edit")}
          className="hover:bg-accent/50 w-full px-3 py-2 text-start"
          dir="ltr"
        >
          <code className="font-mono text-sm">{latex}</code>
        </button>
      )}

      {isEditing && (
        <div className="border-border flex flex-col gap-2 border-t p-3 first:border-t-0">
          <label className="text-muted-foreground flex items-center gap-2 text-xs">
            <Sigma className="size-3.5" />
            {t("math.label")}
          </label>
          <textarea
            ref={textareaRef}
            value={latex}
            rows={2}
            dir="ltr"
            spellCheck={false}
            aria-label={t("math.label")}
            placeholder="E = mc^2"
            onChange={(e) => onChange({ latex: e.target.value })}
            onBlur={() => latex.trim() !== "" && setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && latex.trim() !== "") setEditing(false);
              else if (e.key === "Backspace" && latex === "") onBackspaceEmpty();
            }}
            className="border-border focus-visible:border-ring rounded-md border bg-transparent px-2.5 py-1.5 font-mono text-sm outline-none"
          />
        </div>
      )}

      {result && !result.ok && (
        <p role="alert" className="text-destructive border-border border-t px-3 py-2 text-xs">
          {result.error}
        </p>
      )}
    </div>
  );
}
