import { CheckSquare, Megaphone, PlaySquare, Square, Table2 as Table2Icon } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import type { Block, BoardColumn, Template } from "@/types/entities";

/**
 * A genuine miniature of a template's real content — actual text, actual
 * table cells, actual board column colors and card titles — rendered at
 * normal size in an off-screen-width frame and scaled down with CSS
 * `transform: scale()`, the same technique real template pickers
 * (PowerPoint, Canva, Notion) use. Not a static image and not an abstract
 * wireframe: it reuses the real block components' own Tailwind classes
 * (`TextBlockView`'s heading weights, `BoardBlockView`'s column colors) so
 * a template actually looks like what "Use template" produces, just small.
 *
 * The scale factor is measured live via ResizeObserver rather than
 * hardcoded, since the card's rendered width varies by grid breakpoint —
 * a fixed scale would either leave gaps or overflow depending on how many
 * columns the gallery grid currently has.
 */

const REFERENCE_WIDTH = 380;

const HEADING_CLASSES: Partial<Record<Block["type"], string>> = {
  heading1: "text-2xl font-bold",
  heading2: "text-xl font-semibold",
  heading3: "text-lg font-semibold",
};

const COLUMN_COLOR_CLASSES: Record<BoardColumn["color"], string> = {
  gold: "bg-brand-gold/15 text-brand-gold",
  violet: "bg-brand-violet/15 text-brand-violet",
  mint: "bg-brand-mint/15 text-brand-mint",
};

type PreviewBlock = Pick<Block, "type" | "content">;

function Html({ html, className }: { html: unknown; className?: string }) {
  const value = typeof html === "string" && html.trim() ? html : "&nbsp;";
  // This is the app's own previously-saved content, the same trust level
  // BlockTextEditor already renders it at live-size with — not third-party
  // input being displayed unsanitized.
  return <div className={className} dangerouslySetInnerHTML={{ __html: value }} />;
}

function renderBlock(block: PreviewBlock, key: number) {
  switch (block.type) {
    case "heading1":
    case "heading2":
    case "heading3":
      return (
        <Html key={key} html={block.content.html} className={HEADING_CLASSES[block.type]} />
      );

    case "paragraph":
      return <Html key={key} html={block.content.html} className="text-foreground text-sm" />;

    case "quote":
      return (
        <div key={key} className="border-border border-l-2 pl-3">
          <Html html={block.content.html} className="text-muted-foreground text-sm italic" />
        </div>
      );

    case "callout":
      return (
        <div key={key} className="bg-muted flex items-start gap-2 rounded-md px-3 py-2">
          <Megaphone className="text-brand-gold mt-0.5 size-4 shrink-0" />
          <Html html={block.content.html} className="text-sm" />
        </div>
      );

    case "bulletList":
      return (
        <div key={key} className="flex items-start gap-2 pl-1 text-sm">
          <span className="bg-text-faint mt-2 size-1.5 shrink-0 rounded-full" />
          <Html html={block.content.html} />
        </div>
      );

    case "numberedList":
      return (
        <div key={key} className="flex items-start gap-2 pl-1 text-sm">
          <span className="text-text-faint">•</span>
          <Html html={block.content.html} />
        </div>
      );

    case "checklist": {
      const checked = Boolean(block.content.checked);
      const Icon = checked ? CheckSquare : Square;
      return (
        <div key={key} className="flex items-start gap-2 pl-1 text-sm">
          <Icon
            className={`mt-0.5 size-3.5 shrink-0 ${checked ? "text-brand-mint" : "text-text-faint"}`}
          />
          <Html
            html={block.content.html}
            className={checked ? "text-muted-foreground line-through" : undefined}
          />
        </div>
      );
    }

    case "code": {
      const code = typeof block.content.code === "string" ? block.content.code : "";
      return (
        <pre
          key={key}
          className="bg-muted overflow-hidden rounded-md p-2.5 font-mono text-xs whitespace-pre-wrap"
        >
          {code}
        </pre>
      );
    }

    case "divider":
      return <hr key={key} className="border-border" />;

    case "table": {
      const rows = Array.isArray(block.content.rows) ? (block.content.rows as string[][]) : [];
      return (
        <table key={key} className="border-border w-full border-collapse text-xs">
          <tbody>
            {rows.map((row, r) => (
              // Index keys are safe here: this is a static, decorative,
              // never-reordered read-only preview — not a list a user
              // adds to, removes from, or drags — content alone isn't
              // guaranteed unique (templates commonly have several blank
              // cells in one row).
              // oxlint-disable-next-line react/no-array-index-key
              <tr key={r}>
                {row.map((cell, c) => (
                  <td
                    // oxlint-disable-next-line react/no-array-index-key
                    key={c}
                    className={`border-border truncate border px-2 py-1 ${r === 0 ? "bg-muted font-medium" : ""}`}
                  >
                    {cell || "\u00A0"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    case "image": {
      const url = typeof block.content.url === "string" ? block.content.url : "";
      const alt = typeof block.content.alt === "string" ? block.content.alt : "";
      return url ? (
        <img
          key={key}
          src={url}
          alt={alt}
          className="max-h-32 w-full rounded-md object-cover"
        />
      ) : null;
    }

    case "embed":
      // A live iframe would be wasted work in a gallery of scaled-down
      // previews — this stays a static placeholder, same idea as the
      // simplified 3-column board preview below.
      return (
        <div
          key={key}
          className="bg-muted text-muted-foreground flex aspect-video items-center justify-center rounded-md"
        >
          <PlaySquare className="size-5" />
        </div>
      );

    case "board": {
      const columns = Array.isArray(block.content.columns)
        ? (block.content.columns as BoardColumn[])
        : [];
      return (
        <div key={key} className="flex gap-2">
          {columns.slice(0, 3).map((col) => (
            <div key={col.id} className="bg-muted min-w-0 flex-1 rounded-md p-1.5">
              <div
                className={`truncate rounded px-1.5 py-0.5 text-xs font-semibold ${COLUMN_COLOR_CLASSES[col.color]}`}
              >
                {col.icon ? `${col.icon} ` : ""}
                {col.title}
              </div>
              {col.cards.slice(0, 2).map((card) => (
                <div
                  key={card.id}
                  className="border-border bg-card mt-1 truncate rounded border px-1.5 py-1 text-[10px]"
                >
                  {card.icon ? `${card.icon} ` : ""}
                  {card.title || "Untitled card"}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    case "toggle":
      return <Html key={key} html={block.content.html} className="text-sm font-medium" />;

    case "database":
      // A database block's rows come from live sub-pages of whatever page
      // it ends up on — nothing meaningful to preview from template
      // content alone, so this stays a static placeholder too.
      return (
        <div
          key={key}
          className="bg-muted text-muted-foreground flex h-12 items-center justify-center rounded-md"
        >
          <Table2Icon className="size-4" />
        </div>
      );

    default:
      return null;
  }
}

export function TemplatePreview({ template }: { template: Template }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function updateScale() {
      if (!container) return;
      setScale(container.offsetWidth / REFERENCE_WIDTH);
    }
    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const blocks = [...template.blocks].sort((a, b) => a.order - b.order);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <div
        ref={contentRef}
        aria-hidden="true"
        className="pointer-events-none flex flex-col gap-2.5 p-3 select-none"
        style={{
          width: REFERENCE_WIDTH,
          transform: scale ? `scale(${scale})` : undefined,
          transformOrigin: "top left",
          visibility: scale ? "visible" : "hidden",
        }}
      >
        {blocks.map((block, i) => renderBlock(block, i))}
      </div>
    </div>
  );
}
