import { Filter, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  operatorNeedsValue,
  operatorsForType,
  TITLE_FILTER_KEY,
  type DerivedColumn,
  type FilterOperator,
  type TableFilter,
} from "@/features/database/tableUtils";
import type { MessageKey } from "@/i18n";
import { useT } from "@/i18n/useT";

interface TableFiltersProps {
  columns: DerivedColumn[];
  filters: TableFilter[];
  onChange: (filters: TableFilter[]) => void;
}

const OPERATOR_LABELS: Record<FilterOperator, MessageKey> = {
  contains: "filter.contains",
  equals: "filter.equals",
  notEquals: "filter.notEquals",
  gt: "filter.gt",
  lt: "filter.lt",
  isEmpty: "filter.isEmpty",
  isNotEmpty: "filter.isNotEmpty",
  checked: "filter.checked",
  unchecked: "filter.unchecked",
};

const FIELD_CLASS =
  "border-border focus-visible:border-ring rounded-md border bg-transparent px-2 py-1 text-sm outline-none";

export function TableFilters({ columns, filters, onChange }: TableFiltersProps) {
  const t = useT();

  const typeOf = (key: string) =>
    key === TITLE_FILTER_KEY ? "title" : (columns.find((c) => c.key === key)?.type ?? "text");

  function update(id: string, changes: Partial<TableFilter>) {
    onChange(filters.map((f) => (f.id === id ? { ...f, ...changes } : f)));
  }

  function changeField(filter: TableFilter, key: string) {
    // The new field may not support the current operator, so reset to its first one.
    const [operator] = operatorsForType(typeOf(key));
    update(filter.id, { key, operator, value: "" });
  }

  function addFilter() {
    onChange([
      ...filters,
      { id: crypto.randomUUID(), key: TITLE_FILTER_KEY, operator: "contains", value: "" },
    ]);
  }

  return (
    <fieldset
      className="mb-2 flex min-w-0 flex-col gap-2 border-0 p-0"
      aria-label={t("filter.group")}
    >
      {filters.map((filter) => {
        const type = typeOf(filter.key);
        return (
          <div key={filter.id} className="flex flex-wrap items-center gap-2">
            <select
              aria-label={t("filter.field")}
              value={filter.key}
              onChange={(e) => changeField(filter, e.target.value)}
              className={FIELD_CLASS}
            >
              <option value={TITLE_FILTER_KEY}>{t("filter.name")}</option>
              {columns.map((column) => (
                <option key={column.key} value={column.key}>
                  {column.key}
                </option>
              ))}
            </select>
            <select
              aria-label={t("filter.operator")}
              value={filter.operator}
              onChange={(e) =>
                update(filter.id, { operator: e.target.value as FilterOperator })
              }
              className={FIELD_CLASS}
            >
              {operatorsForType(type).map((operator) => (
                <option key={operator} value={operator}>
                  {t(OPERATOR_LABELS[operator])}
                </option>
              ))}
            </select>
            {operatorNeedsValue(filter.operator) && (
              <input
                aria-label={t("filter.value")}
                type={type === "number" ? "number" : type === "date" ? "date" : "text"}
                value={filter.value}
                dir="auto"
                onChange={(e) => update(filter.id, { value: e.target.value })}
                className={`${FIELD_CLASS} min-w-32`}
              />
            )}
            <button
              type="button"
              aria-label={t("filter.remove")}
              onClick={() => onChange(filters.filter((f) => f.id !== filter.id))}
              className="text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-md"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={addFilter}
      >
        {filters.length === 0 ? <Filter className="size-3.5" /> : <Plus className="size-3.5" />}
        {t(filters.length === 0 ? "filter.add" : "filter.addAnother")}
      </Button>
    </fieldset>
  );
}
