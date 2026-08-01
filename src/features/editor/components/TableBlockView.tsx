import { Plus } from "lucide-react";

interface TableBlockViewProps {
  rows: string[][];
  onChange: (content: { rows: string[][] }) => void;
}

export function TableBlockView({ rows, onChange }: TableBlockViewProps) {
  const columnCount = rows[0]?.length ?? 2;

  function setCell(rowIndex: number, colIndex: number, value: string) {
    const next = rows.map((row, r) =>
      r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row,
    );
    onChange({ rows: next });
  }

  function addRow() {
    onChange({ rows: [...rows, Array.from({ length: columnCount }, () => "")] });
  }

  function addColumn() {
    onChange({ rows: rows.map((row) => [...row, ""]) });
  }

  return (
    <div className="border-border overflow-x-auto rounded-md border">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {/* Rows/columns are append-only in this basic table (no reorder or
              delete), so position is a stable identity here — there's no
              natural per-cell id in the plain string[][] content shape. */}
          {rows.map((row, rowIndex) => (
            // oxlint-disable-next-line react/no-array-index-key
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                // oxlint-disable-next-line react/no-array-index-key
                <td key={colIndex} className="border-border border p-0">
                  <input
                    value={cell}
                    onChange={(e) => setCell(rowIndex, colIndex, e.target.value)}
                    aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}`}
                    className="focus-visible:bg-accent w-full min-w-24 bg-transparent px-2 py-1.5 outline-none"
                  />
                </td>
              ))}
              {rowIndex === 0 && (
                <td className="w-8 border-none p-0 align-middle">
                  <button
                    type="button"
                    onClick={addColumn}
                    aria-label="Add column"
                    className="text-text-faint hover:text-foreground flex size-7 items-center justify-center"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={addRow}
        className="border-border text-text-faint hover:text-foreground flex w-full items-center justify-center gap-1.5 border-t py-1.5 text-xs"
      >
        <Plus className="size-3.5" />
        Add row
      </button>
    </div>
  );
}
