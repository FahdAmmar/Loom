import { useEffect, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";

import * as propertiesApi from "@/api/pageProperties";
import { getSelectOptions, parseOptionList } from "@/lib/properties";
import { cn } from "@/lib/utils";
import type { PageProperty, PagePropertyType } from "@/types/entities";

const PROPERTY_TYPES: { value: PagePropertyType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
];

export function PropertyValueInput({
  property,
  onChange,
}: {
  property: PageProperty;
  onChange: (value: PageProperty["value"]) => void;
}) {
  switch (property.type) {
    case "checkbox":
      return (
        <input
          type="checkbox"
          checked={Boolean(property.value)}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-brand-mint size-4"
          aria-label={property.key}
        />
      );
    case "number":
      return (
        <input
          type="number"
          value={typeof property.value === "number" ? property.value : ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          aria-label={property.key}
          className="text-foreground w-full bg-transparent text-sm outline-none"
        />
      );
    case "date":
      return (
        <input
          type="date"
          value={typeof property.value === "string" ? property.value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          aria-label={property.key}
          className="text-foreground w-full bg-transparent text-sm outline-none"
        />
      );
    case "select":
      return (
        <select
          value={typeof property.value === "string" ? property.value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          aria-label={property.key}
          className="text-foreground w-full bg-transparent text-sm outline-none"
        >
          <option value="">—</option>
          {getSelectOptions(property).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    default:
      return (
        <input
          type="text"
          value={typeof property.value === "string" ? property.value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Empty"
          aria-label={property.key}
          className="text-foreground placeholder:text-text-faint w-full bg-transparent text-sm outline-none"
        />
      );
  }
}

export function PageProperties({ pageId }: { pageId: string }) {
  const [properties, setProperties] = useState<PageProperty[]>([]);
  const [isAdding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newType, setNewType] = useState<PagePropertyType>("text");
  const [newOptions, setNewOptions] = useState("");
  const [editingOptionsId, setEditingOptionsId] = useState<string | null>(null);
  const [optionsDraft, setOptionsDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    propertiesApi.getPropertiesForPage(pageId).then((props) => {
      if (!cancelled) setProperties(props);
    });
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  async function handleValueChange(property: PageProperty, value: PageProperty["value"]) {
    setProperties((prev) => prev.map((p) => (p.id === property.id ? { ...p, value } : p)));
    await propertiesApi.updatePropertyValue(property.id, value);
  }

  async function handleDelete(id: string) {
    setProperties((prev) => prev.filter((p) => p.id !== id));
    await propertiesApi.deleteProperty(id);
  }

  async function handleAdd() {
    const trimmed = newKey.trim();
    if (!trimmed) return;
    const property = await propertiesApi.addProperty(
      pageId,
      trimmed,
      newType,
      newType === "select" ? parseOptionList(newOptions) : undefined,
    );
    setProperties((prev) => [...prev, property]);
    setNewKey("");
    setNewType("text");
    setNewOptions("");
    setAdding(false);
  }

  function startEditingOptions(property: PageProperty) {
    setOptionsDraft(getSelectOptions({ options: property.options, value: null }).join(", "));
    setEditingOptionsId(property.id);
  }

  async function saveOptions(property: PageProperty) {
    setEditingOptionsId(null);
    const updated = await propertiesApi.updatePropertyOptions(
      property.id,
      parseOptionList(optionsDraft),
    );
    setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  if (properties.length === 0 && !isAdding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="text-text-faint hover:text-foreground mt-3 flex items-center gap-1.5 text-xs"
      >
        <Plus className="size-3.5" />
        Add a property
      </button>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-1.5">
      {properties.map((property) => (
        <div key={property.id} className="flex flex-col gap-1">
          <div className="group flex items-center gap-3 text-sm">
            <span className="text-text-faint w-28 shrink-0 truncate">{property.key}</span>
            <div className="min-w-0 flex-1">
              <PropertyValueInput
                property={property}
                onChange={(v) => handleValueChange(property, v)}
              />
            </div>
            {property.type === "select" && (
              <button
                type="button"
                onClick={() => startEditingOptions(property)}
                aria-label={`Edit options for ${property.key}`}
                title="Edit options"
                className="text-text-faint hover:text-foreground shrink-0 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
              >
                <Pencil className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDelete(property.id)}
              aria-label={`Remove property ${property.key}`}
              className="text-text-faint hover:text-destructive shrink-0 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
          {editingOptionsId === property.id && (
            <div className="flex items-center gap-2 pl-[7.75rem]">
              <input
                value={optionsDraft}
                onChange={(e) => setOptionsDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveOptions(property);
                  if (e.key === "Escape") setEditingOptionsId(null);
                }}
                aria-label={`Options for ${property.key}, separated by commas`}
                placeholder="Low, Medium, High"
                className="border-border min-w-0 flex-1 rounded border bg-transparent px-2 py-1 text-xs outline-none"
              />
              <button
                type="button"
                onClick={() => saveOptions(property)}
                className="text-primary text-xs font-medium"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingOptionsId(null)}
                className="text-text-faint hover:text-foreground text-xs"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ))}

      {isAdding ? (
        <div className="flex items-center gap-2 pt-1">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Property name"
            className="border-border w-28 rounded border bg-transparent px-2 py-1 text-xs outline-none"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as PagePropertyType)}
            className="border-border rounded border bg-transparent px-1.5 py-1 text-xs"
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {newType === "select" && (
            <input
              value={newOptions}
              onChange={(e) => setNewOptions(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              aria-label="Options, separated by commas"
              placeholder="Options: Low, Medium, High"
              className="border-border w-52 rounded border bg-transparent px-2 py-1 text-xs outline-none"
            />
          )}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newKey.trim()}
            className={cn(
              "text-xs font-medium",
              newKey.trim() ? "text-primary" : "text-text-faint",
            )}
          >
            Add
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-text-faint hover:text-foreground flex items-center gap-1.5 text-xs"
        >
          <Plus className="size-3.5" />
          Add a property
        </button>
      )}
    </div>
  );
}
