import type { Block, BoardColumn, Template } from "@/types/entities";

/**
 * A schematic thumbnail of a template's actual content — not a static
 * image, but a small SVG rendered from `template.blocks` itself. That
 * means it can never drift out of sync with what "Use template" actually
 * produces, and a template saved later from a real page (PageActionsMenu's
 * "Save as template") gets a correct preview for free, with no image to
 * generate or store anywhere.
 *
 * Uses the app's own CSS custom properties directly (`var(--foreground)`
 * etc.) rather than Tailwind color classes, since those already respond to
 * the `.dark` class the same way the rest of the app does — no separate
 * light/dark handling needed here.
 */

const VIEW_WIDTH = 160;
const VIEW_HEIGHT = 200;
const PAD_X = 16;
const CONTENT_WIDTH = VIEW_WIDTH - PAD_X * 2;
const MAX_Y = VIEW_HEIGHT - 14;

type PreviewBlock = Pick<Block, "type" | "content">;

interface RenderResult {
  height: number;
  node: React.ReactNode;
}

function headingRow(key: string, y: number, widthFrac: number, weight: number): RenderResult {
  const h = 6 + weight * 1.5;
  return {
    height: h + 8,
    node: (
      <rect
        key={key}
        x={PAD_X}
        y={y}
        width={CONTENT_WIDTH * widthFrac}
        height={h}
        rx={2}
        fill="var(--foreground)"
        opacity={0.55 + weight * 0.15}
      />
    ),
  };
}

function paragraphRow(key: string, y: number): RenderResult {
  return {
    height: 20,
    node: (
      <g key={key}>
        <rect
          x={PAD_X}
          y={y}
          width={CONTENT_WIDTH}
          height={4}
          rx={2}
          fill="var(--muted-foreground)"
          opacity={0.4}
        />
        <rect
          x={PAD_X}
          y={y + 7}
          width={CONTENT_WIDTH * 0.68}
          height={4}
          rx={2}
          fill="var(--muted-foreground)"
          opacity={0.4}
        />
      </g>
    ),
  };
}

function listRow(key: string, y: number, marker: "bullet" | "number" | "check"): RenderResult {
  const markerNode =
    marker === "bullet" ? (
      <circle cx={PAD_X + 3} cy={y + 4} r={2} fill="var(--muted-foreground)" />
    ) : marker === "check" ? (
      <rect
        x={PAD_X}
        y={y + 1.5}
        width={5}
        height={5}
        rx={1}
        fill="none"
        stroke="var(--muted-foreground)"
        strokeWidth={1}
      />
    ) : (
      <rect
        x={PAD_X}
        y={y + 1.5}
        width={5}
        height={5}
        rx={1}
        fill="var(--muted-foreground)"
        opacity={0.3}
      />
    );
  return {
    height: 11,
    node: (
      <g key={key}>
        {markerNode}
        <rect
          x={PAD_X + 10}
          y={y}
          width={CONTENT_WIDTH - 10}
          height={4}
          rx={2}
          fill="var(--muted-foreground)"
          opacity={0.4}
        />
      </g>
    ),
  };
}

function quoteRow(key: string, y: number): RenderResult {
  return {
    height: 22,
    node: (
      <g key={key}>
        <rect x={PAD_X} y={y} width={2} height={14} fill="var(--brand-violet)" opacity={0.5} />
        <rect
          x={PAD_X + 8}
          y={y + 5}
          width={CONTENT_WIDTH * 0.6}
          height={4}
          rx={2}
          fill="var(--muted-foreground)"
          opacity={0.4}
        />
      </g>
    ),
  };
}

function calloutRow(key: string, y: number): RenderResult {
  return {
    height: 30,
    node: (
      <g key={key}>
        <rect
          x={PAD_X}
          y={y}
          width={CONTENT_WIDTH}
          height={22}
          rx={5}
          fill="var(--brand-gold)"
          opacity={0.12}
        />
        <circle cx={PAD_X + 10} cy={y + 11} r={3.5} fill="var(--brand-gold)" opacity={0.6} />
        <rect
          x={PAD_X + 18}
          y={y + 9}
          width={CONTENT_WIDTH - 30}
          height={4}
          rx={2}
          fill="var(--brand-gold)"
          opacity={0.5}
        />
      </g>
    ),
  };
}

function codeRow(key: string, y: number): RenderResult {
  return {
    height: 34,
    node: (
      <g key={key}>
        <rect
          x={PAD_X}
          y={y}
          width={CONTENT_WIDTH}
          height={26}
          rx={4}
          fill="var(--foreground)"
          opacity={0.06}
        />
        <rect
          x={PAD_X + 6}
          y={y + 6}
          width={CONTENT_WIDTH * 0.5}
          height={3}
          rx={1.5}
          fill="var(--muted-foreground)"
          opacity={0.45}
        />
        <rect
          x={PAD_X + 6}
          y={y + 12}
          width={CONTENT_WIDTH * 0.7}
          height={3}
          rx={1.5}
          fill="var(--muted-foreground)"
          opacity={0.45}
        />
        <rect
          x={PAD_X + 6}
          y={y + 18}
          width={CONTENT_WIDTH * 0.35}
          height={3}
          rx={1.5}
          fill="var(--muted-foreground)"
          opacity={0.45}
        />
      </g>
    ),
  };
}

function dividerRow(key: string, y: number): RenderResult {
  return {
    height: 12,
    node: (
      <line
        key={key}
        x1={PAD_X}
        x2={PAD_X + CONTENT_WIDTH}
        y1={y + 3}
        y2={y + 3}
        stroke="var(--border)"
        strokeWidth={1}
      />
    ),
  };
}

function tableRow(key: string, y: number, content: Record<string, unknown>): RenderResult {
  const rows = Array.isArray(content.rows) ? (content.rows as unknown[][]) : [[""], [""]];
  const rowCount = Math.min(rows.length, 3);
  const colCount = Math.min(Array.isArray(rows[0]) ? rows[0].length : 2, 3);
  const cellH = 9;
  const cellW = CONTENT_WIDTH / colCount;
  const cells = [];
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      cells.push(
        <rect
          key={`${key}-${r}-${c}`}
          x={PAD_X + c * cellW}
          y={y + r * cellH}
          width={cellW}
          height={cellH}
          fill={r === 0 ? "var(--muted)" : "none"}
          stroke="var(--border)"
          strokeWidth={1}
        />,
      );
    }
  }
  return { height: rowCount * cellH + 8, node: <g key={key}>{cells}</g> };
}

function imageRow(key: string, y: number): RenderResult {
  return {
    height: 38,
    node: (
      <g key={key}>
        <rect x={PAD_X} y={y} width={CONTENT_WIDTH} height={30} rx={4} fill="var(--muted)" />
        <circle
          cx={PAD_X + 14}
          cy={y + 11}
          r={3}
          fill="var(--muted-foreground)"
          opacity={0.5}
        />
        <path
          d={`M ${PAD_X + 4} ${y + 25} L ${PAD_X + 18} ${y + 13} L ${PAD_X + 30} ${y + 22} L ${PAD_X + CONTENT_WIDTH - 4} ${y + 10} L ${PAD_X + CONTENT_WIDTH - 4} ${y + 25} Z`}
          fill="var(--muted-foreground)"
          opacity={0.35}
        />
      </g>
    ),
  };
}

const BOARD_COLORS: Record<BoardColumn["color"], string> = {
  gold: "var(--brand-gold)",
  violet: "var(--brand-violet)",
  mint: "var(--brand-mint)",
};

function boardRow(key: string, y: number, content: Record<string, unknown>): RenderResult {
  const columns = Array.isArray(content.columns) ? (content.columns as BoardColumn[]) : [];
  const shown = columns.slice(0, 3);
  const gap = 4;
  const colWidth = (CONTENT_WIDTH - gap * (shown.length - 1)) / Math.max(shown.length, 1);
  const height = 40;
  const nodes = shown.map((col, i) => {
    const x = PAD_X + i * (colWidth + gap);
    const color = BOARD_COLORS[col.color] ?? "var(--muted-foreground)";
    return (
      <g key={`${key}-${col.id}`}>
        <rect x={x} y={y} width={colWidth} height={height} rx={4} fill={color} opacity={0.1} />
        <rect
          x={x + 3}
          y={y + 3}
          width={colWidth - 6}
          height={5}
          rx={2}
          fill={color}
          opacity={0.55}
        />
        {col.cards.length > 0 && (
          <rect
            x={x + 3}
            y={y + 12}
            width={colWidth - 6}
            height={10}
            rx={2}
            fill="var(--card)"
            stroke="var(--border)"
            strokeWidth={1}
          />
        )}
      </g>
    );
  });
  return { height: height + 8, node: <g key={key}>{nodes}</g> };
}

function renderBlock(block: PreviewBlock, index: number, y: number): RenderResult | null {
  const key = `b-${index}`;
  switch (block.type) {
    case "heading1":
      return headingRow(key, y, 0.85, 3);
    case "heading2":
      return headingRow(key, y, 0.7, 2);
    case "heading3":
      return headingRow(key, y, 0.55, 1);
    case "paragraph":
      return paragraphRow(key, y);
    case "bulletList":
      return listRow(key, y, "bullet");
    case "numberedList":
      return listRow(key, y, "number");
    case "checklist":
      return listRow(key, y, "check");
    case "quote":
      return quoteRow(key, y);
    case "callout":
      return calloutRow(key, y);
    case "code":
      return codeRow(key, y);
    case "divider":
      return dividerRow(key, y);
    case "table":
      return tableRow(key, y, block.content);
    case "image":
      return imageRow(key, y);
    case "board":
      return boardRow(key, y, block.content);
    case "toggle":
      return headingRow(key, y, 0.5, 0);
    default:
      return null;
  }
}

export function TemplatePreview({ template }: { template: Template }) {
  const blocks = [...template.blocks].sort((a, b) => a.order - b.order);

  const nodes: React.ReactNode[] = [];
  let y = 16;
  let truncated = false;
  for (let i = 0; i < blocks.length; i++) {
    const result = renderBlock(blocks[i], i, y);
    if (!result) continue;
    if (y + result.height > MAX_Y) {
      truncated = true;
      break;
    }
    nodes.push(result.node);
    y += result.height;
  }

  return (
    <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="h-full w-full">
      <title>{`Preview of ${template.name}`}</title>
      {nodes}
      {truncated && (
        <defs>
          <linearGradient id={`fade-${template.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--card)" stopOpacity="0" />
            <stop offset="1" stopColor="var(--card)" stopOpacity="1" />
          </linearGradient>
        </defs>
      )}
      {truncated && (
        <rect
          x={0}
          y={VIEW_HEIGHT - 28}
          width={VIEW_WIDTH}
          height={28}
          fill={`url(#fade-${template.id})`}
        />
      )}
    </svg>
  );
}
