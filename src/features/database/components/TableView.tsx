import { ChevronDown, ChevronUp, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import * as propertiesApi from "@/api/pageProperties";
import { Button } from "@/components/ui/button";
import type { DerivedColumn } from "@/features/database/tableUtils";
import { sortPagesByColumn } from "@/features/database/tableUtils";
import { PropertyValueInput } from "@/features/pages/components/PageProperties";
import { cn } from "@/lib/utils";
import type { Page, PageProperty, PagePropertyType } from "@/types/entities";

interface TableViewProps {
  pages: Page[];
  properties: PageProperty[];
  columns: DerivedColumn[];
  onPropertiesChange: (next: PageProperty[]) => void;
  onAddPage: () => void;
}

const PROPERTY_TYPES: { value: PagePropertyType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
];

export function TableView({
  pages,
  properties,
  columns,
  onPropertiesChange,
  onAddPage,
}: TableViewProps) {
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [isAddingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<PagePropertyType>("text");

  function toggleSort(column: DerivedColumn) {
    setSort((current) => {
      if (current?.key !== column.key) return { key: column.key, direction: "asc" };
      if (current.direction === "asc") return { key: column.key, direction: "desc" };
      return null; // third click clears back to the original order
    });
  }

  async function handleCellChange(property: PageProperty, value: PageProperty["value"]) {
    onPropertiesChange(properties.map((p) => (p.id === property.id ? { ...p, value } : p)));
    await propertiesApi.updatePropertyValue(property.id, value);
  }

  async function handleCreateCellValue(page: Page, column: DerivedColumn) {
    const created = await propertiesApi.addProperty(page.id, column.key, column.type);
    onPropertiesChange([...properties, created]);
  }

  async function handleAddColumn() {
    const trimmed = newColumnName.trim();
    if (!trimmed || pages.length === 0) return;
    const created = await propertiesApi.addPropertyToPages(
      pages.map((p) => p.id),
      trimmed,
      newColumnType,
    );
    onPropertiesChange([...properties, ...created]);
    setNewColumnName("");
    setNewColumnType("text");
    setAddingColumn(false);
  }

  if (pages.length === 0) {
    return (
      <div className="border-border flex flex-col items-center gap-2 rounded-md border border-dashed px-6 py-8 text-center">
        <p className="text-muted-foreground text-sm">No sub-pages yet</p>
        <p className="text-text-faint text-xs">
          Pages you add under this one show up here as rows.
        </p>
        <Button size="sm" className="mt-1" onClick={onAddPage}>
          <Plus className="size-3.5" />
          New page
        </Button>
      </div>
    );
  }

  const sortColumn = columns.find((c) => c.key === sort?.key);
  const rows =
    sort && sortColumn
      ? sortPagesByColumn(pages, properties, sortColumn, sort.direction)
      : pages;

  return (
    <div className="border-border overflow-x-auto rounded-md border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-border border-b">
            <th scope="col" className="text-muted-foreground px-3 py-2 text-left font-medium">
              Name
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="text-muted-foreground border-border border-l px-3 py-2 text-left font-medium"
              >
                <button
                  type="button"
                  onClick={() => toggleSort(column)}
                  className="hover:text-foreground flex items-center gap-1"
                >
                  {column.key}
                  {sort?.key === column.key ? (
                    sort.direction === "asc" ? (
                      <ChevronUp className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )
                  ) : (
                    <ChevronsUpDown className="text-text-faint size-3.5" />
                  )}
                </button>
              </th>
            ))}
            <th scope="col" className="border-border border-l px-2 py-2">
              {isAddingColumn ? (
                <div className="flex items-center gap-1.5">
                  <input
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
                    placeholder="Property name"
                    className="border-border w-24 rounded border bg-transparent px-1.5 py-1 text-xs font-normal outline-none"
                  />
                  <select
                    value={newColumnType}
                    onChange={(e) => setNewColumnType(e.target.value as PagePropertyType)}
                    className="border-border rounded border bg-transparent px-1 py-1 text-xs font-normal"
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddColumn}
                    disabled={!newColumnName.trim()}
                    className={cn(
                      "text-xs font-medium",
                      newColumnName.trim() ? "text-primary" : "text-text-faint",
                    )}
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingColumn(true)}
                  aria-label="Add column"
                  title="Add column"
                  className="text-text-faint hover:text-foreground flex size-6 items-center justify-center rounded"
                >
                  <Plus className="size-3.5" />
                </button>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((page) => (
            <tr key={page.id} className="border-border border-b last:border-b-0">
              <td className="px-3 py-1.5">
                <Link
                  viewTransition
                  to={`/w/${page.workspaceId}/p/${page.id}`}
                  className="text-foreground hover:underline"
                >
                  {page.title || "Untitled"}
                </Link>
              </td>
              {columns.map((column) => {
                const property = properties.find(
                  (p) => p.pageId === page.id && p.key === column.key,
                );
                return (
                  <td key={column.key} className="border-border border-l px-3 py-1.5">
                    {property ? (
                      <PropertyValueInput
                        property={property}
                        onChange={(v) => handleCellChange(property, v)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCreateCellValue(page, column)}
                        aria-label={`Set ${column.key} for ${page.title}`}
                        className="text-text-faint hover:text-foreground text-xs"
                      >
                        Set value
                      </button>
                    )}
                  </td>
                );
              })}
              <td className="border-border border-l" aria-hidden="true" />
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={onAddPage}
        className="text-text-faint hover:text-foreground hover:bg-accent flex w-full items-center gap-1.5 px-3 py-2 text-xs"
      >
        <Plus className="size-3.5" />
        New page
      </button>
    </div>
  );
}
