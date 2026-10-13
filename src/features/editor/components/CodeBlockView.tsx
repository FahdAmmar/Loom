import { useEffect, useRef, useState } from "react";

import { useT } from "@/i18n/useT";
import { CODE_LANGUAGES, highlightCode, resolveCodeLanguage } from "@/lib/highlightCode";

interface CodeBlockViewProps {
  code: string;
  language?: string;
  onChange: (content: { code: string; language?: string }) => void;
  onBackspaceEmpty: () => void;
}

const LANGUAGE_NAMES = Object.keys(CODE_LANGUAGES);

// The textarea and the highlighted layer must share every text metric to stay aligned.
const TEXT_LAYER =
  "col-start-1 row-start-1 px-3 py-2 font-mono text-sm leading-normal whitespace-pre-wrap break-words";

export function CodeBlockView({
  code,
  language,
  onChange,
  onBackspaceEmpty,
}: CodeBlockViewProps) {
  const t = useT();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const selected = resolveCodeLanguage(language);

  useEffect(() => {
    let cancelled = false;
    highlightCode(code, language)
      .then((html) => !cancelled && setHighlighted(html))
      .catch(() => !cancelled && setHighlighted(null));
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  return (
    <div className="border-border bg-muted rounded-md border">
      <div className="border-border flex items-center border-b px-2 py-1">
        <select
          aria-label={t("code.language")}
          value={selected ?? ""}
          onChange={(e) => onChange({ code, language: e.target.value || undefined })}
          className="text-text-faint hover:text-foreground cursor-pointer rounded bg-transparent px-1 font-mono text-xs"
        >
          <option value="">{t("code.plainText")}</option>
          {LANGUAGE_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid" dir="ltr">
        {highlighted !== null && (
          <pre aria-hidden="true" className={`${TEXT_LAYER} m-0 overflow-hidden`}>
            <code dangerouslySetInnerHTML={{ __html: highlighted }} />
            {/* A trailing newline would otherwise collapse and shift the last line. */}
            {code.endsWith("\n") ? "\n" : ""}
          </pre>
        )}
        <textarea
          ref={textareaRef}
          value={code}
          rows={1}
          spellCheck={false}
          aria-label={t("code.label")}
          dir="ltr"
          placeholder={t("code.placeholder")}
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
          className={`${TEXT_LAYER} text-foreground resize-none overflow-hidden bg-transparent outline-none ${
            highlighted !== null ? "caret-foreground relative text-transparent" : ""
          }`}
        />
      </div>
    </div>
  );
}
