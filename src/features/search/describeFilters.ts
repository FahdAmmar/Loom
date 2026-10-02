import type { MessageKey } from "@/i18n";
import type { ParsedSearch } from "@/lib/searchQuery";

export interface FilterChip {
  key: string;
  label: MessageKey;
  params?: { days: number };
}

const SCOPE_LABELS = {
  title: "palette.filter.title",
  content: "palette.filter.content",
  tag: "palette.filter.tag",
} as const satisfies Record<string, MessageKey>;

/** What to show as chips so it's clear which filters the typed words switched on. */
export function describeFilters({ scopes, updated }: ParsedSearch): FilterChip[] {
  const chips: FilterChip[] = scopes.map((scope) => ({
    key: `in-${scope}`,
    label: SCOPE_LABELS[scope],
  }));
  if (updated?.kind === "today") {
    chips.push({ key: "updated", label: "palette.filter.today" });
  } else if (updated?.days === 7) {
    chips.push({ key: "updated", label: "palette.filter.week" });
  } else if (updated?.days === 30) {
    chips.push({ key: "updated", label: "palette.filter.month" });
  } else if (updated) {
    chips.push({
      key: "updated",
      label: "palette.filter.days",
      params: { days: updated.days },
    });
  }
  return chips;
}
