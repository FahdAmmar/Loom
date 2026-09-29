import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Columns2,
  Plus,
  Rows2,
  SplitSquareHorizontal,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import {
  deleteLine,
  extendMerge,
  findMergeAt,
  getColumnCount,
  getColumnWidths,
  insertLine,
  isCoveredCell,
  setCell,
  setColumnWidth,
  unmergeCell,
  type TableContent,
} from "@/lib/table";
import { cn } from "@/lib/utils";

interface TableBlockViewProps {
  table: TableContent;
  onChange: (table: TableContent) => void;
}

interface ToolbarAction {
  label: string;
  icon: LucideIcon;
  run: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

const KEYBOARD_RESIZE_STEP = 16;

export function TableBlockView({ table, onChange }: TableBlockViewProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  // Which cell the toolbar acts on — the last one focused. Kept in state
  // (not derived from document.activeElement) because clicking a toolbar
  // button moves focus off the cell before its handler runs.
  const [active, setActive] = useState({ row: 0, col: 0 });
  // While a column is being dragged, its width lives here so every pointer
  // move re-renders cheaply; it's committed to the block once on release.
  const [dragWidths, setDragWidths] = useState<number[] | null>(null);

  const rowCount = table.rows.length;
  const columnCount = getColumnCount(table);
  const row = Math.min(active.row, rowCount - 1);
  const col = Math.min(active.col, columnCount - 1);
  const activeMerge = findMergeAt(table, row, col);

  const widths = dragWidths ?? table.colWidths;
  const totalWidth = widths?.reduce((sum, w) => sum + w, 0);

  function apply(next: TableContent | null) {
    if (next) onChange(next);
  }

  // Insert-above/left and below/right step around any merge the active cell
  // belongs to, so a new line lands next to the merged area, not inside it.
  const rowStart = activeMerge ? activeMerge.row : row;
  const rowEnd = activeMerge ? activeMerge.row + activeMerge.rowSpan : row + 1;
  const colStart = activeMerge ? activeMerge.col : col;
  const colEnd = activeMerge ? activeMerge.col + activeMerge.colSpan : col + 1;

  const mergeRight = extendMerge(table, row, col, "right");
  const mergeDown = extendMerge(table, row, col, "down");

  const groups: { label: string; actions: ToolbarAction[] }[] = [
    {
      label: "Rows",
      actions: [
        {
          label: "Insert row above",
          icon: ArrowUpToLine,
          run: () => apply(insertLine(table, "row", rowStart)),
        },
        {
          label: "Insert row below",
          icon: ArrowDownToLine,
          run: () => apply(insertLine(table, "row", rowEnd)),
        },
        {
          label: "Delete row",
          icon: Trash2,
          run: () => apply(deleteLine(table, "row", row)),
          disabled: rowCount <= 1,
          destructive: true,
        },
      ],
    },
    {
      label: "Columns",
      actions: [
        {
          label: "Insert column left",
          icon: ArrowLeftToLine,
          run: () => apply(insertLine(table, "col", colStart)),
        },
        {
          label: "Insert column right",
          icon: ArrowRightToLine,
          run: () => apply(insertLine(table, "col", colEnd)),
        },
        {
          label: "Delete column",
          icon: Trash2,
          run: () => apply(deleteLine(table, "col", col)),
          disabled: columnCount <= 1,
          destructive: true,
        },
      ],
    },
    {
      label: "Cells",
      actions: [
        {
          label: "Merge with cell to the right",
          icon: Columns2,
          run: () => apply(mergeRight),
          disabled: mergeRight === null,
        },
        {
          label: "Merge with cell below",
          icon: Rows2,
          run: () => apply(mergeDown),
          disabled: mergeDown === null,
        },
        {
          label: "Split merged cell",
          icon: SplitSquareHorizontal,
          run: () => apply(unmergeCell(table, row, col)),
          disabled: !activeMerge,
        },
      ],
    },
  ];

  /** Widths as currently rendered, so the first drag doesn't make other columns jump. */
  function measureWidths(): number[] {
    const fallback = getColumnWidths(table);
    const element = tableRef.current;
    if (!element) return fallback;
    return fallback.map((defaultWidth, c) => {
      const cell = element.querySelector<HTMLElement>(`td[data-col="${c}"][data-colspan="1"]`);
      return cell ? cell.offsetWidth : defaultWidth;
    });
  }

  function startResize(e: PointerEvent<HTMLButtonElement>, targetCol: number) {
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startWidths = table.colWidths ?? measureWidths();
    const startWidth = startWidths[targetCol];
    let latest = startWidths;

    function onMove(ev: globalThis.PointerEvent) {
      latest =
        setColumnWidth(table, targetCol, startWidth + ev.clientX - startX, startWidths)
          .colWidths ?? startWidths;
      setDragWidths(latest);
    }
    function onUp() {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      setDragWidths(null);
      onChange(setColumnWidth(table, targetCol, latest[targetCol], startWidths));
    }
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  }

  function handleResizeKey(e: KeyboardEvent<HTMLButtonElement>, targetCol: number) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const current = table.colWidths ?? measureWidths();
    const delta = e.key === "ArrowRight" ? KEYBOARD_RESIZE_STEP : -KEYBOARD_RESIZE_STEP;
    onChange(setColumnWidth(table, targetCol, current[targetCol] + delta, current));
  }

  return (
    <div className="group/table flex flex-col gap-1">
      <div
        role="toolbar"
        aria-label="Table tools"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 opacity-0 transition-opacity group-focus-within/table:opacity-100 group-hover/table:opacity-100"
      >
        {groups.map((group) => (
          <fieldset key={group.label} className="m-0 flex min-w-0 gap-0.5 border-0 p-0">
            <legend className="sr-only">{group.label}</legend>
            {group.actions.map(({ label, icon: Icon, run, disabled, destructive }) => (
              <button
                key={label}
                type="button"
                onClick={run}
                disabled={disabled}
                aria-label={label}
                title={label}
                className={cn(
                  "text-muted-foreground flex size-6 items-center justify-center rounded",
                  "hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
                  destructive && "hover:text-destructive",
                )}
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </fieldset>
        ))}
      </div>

      <div className="flex items-stretch gap-1">
        <div className="border-border min-w-0 flex-1 overflow-x-auto rounded-md border">
          <table
            ref={tableRef}
            className={cn("border-collapse text-sm", widths ? "table-fixed" : "w-full")}
            style={widths ? { width: totalWidth } : undefined}
          >
            {widths && (
              <colgroup>
                {widths.map((width, c) => (
                  // oxlint-disable-next-line react/no-array-index-key
                  <col key={c} style={{ width }} />
                ))}
              </colgroup>
            )}
            <tbody>
              {/* Rows and columns can be inserted or deleted anywhere, but
                  cells are plain strings with no ids of their own, so position
                  is still the only identity a cell has here. */}
              {table.rows.map((cells, rowIndex) => (
                // oxlint-disable-next-line react/no-array-index-key
                <tr key={rowIndex}>
                  {cells.map((cell, colIndex) => {
                    if (isCoveredCell(table, rowIndex, colIndex)) return null;
                    const merge = findMergeAt(table, rowIndex, colIndex);
                    const colSpan = merge?.colSpan ?? 1;
                    const lastCol = colIndex + colSpan - 1;
                    return (
                      <td
                        // oxlint-disable-next-line react/no-array-index-key
                        key={colIndex}
                        rowSpan={merge?.rowSpan}
                        colSpan={merge?.colSpan}
                        data-col={colIndex}
                        data-colspan={colSpan}
                        className="border-border relative border p-0 align-top"
                      >
                        <input
                          value={cell}
                          onChange={(e) =>
                            onChange(setCell(table, rowIndex, colIndex, e.target.value))
                          }
                          onFocus={() => setActive({ row: rowIndex, col: colIndex })}
                          aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}`}
                          className="focus-visible:bg-accent w-full min-w-16 bg-transparent px-2 py-1.5 outline-none"
                        />
                        <button
                          type="button"
                          onPointerDown={(e) => startResize(e, lastCol)}
                          onKeyDown={(e) => handleResizeKey(e, lastCol)}
                          aria-label={`Resize column ${lastCol + 1} (drag, or use the left and right arrow keys)`}
                          className="hover:bg-primary/40 focus-visible:bg-primary/60 absolute top-0 -right-1 z-10 h-full w-2 cursor-col-resize touch-none outline-none"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={() => onChange(insertLine(table, "row", rowCount))}
            className="border-border text-text-faint hover:text-foreground flex w-full items-center justify-center gap-1.5 border-t py-1.5 text-xs"
          >
            <Plus className="size-3.5" />
            Add row
          </button>
        </div>
        <button
          type="button"
          onClick={() => onChange(insertLine(table, "col", columnCount))}
          aria-label="Add column"
          title="Add column"
          className="text-text-faint hover:text-foreground hover:bg-accent flex w-6 shrink-0 items-center justify-center rounded"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
