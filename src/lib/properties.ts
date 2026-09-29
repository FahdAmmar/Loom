import type { PageProperty } from "@/types/entities";

/** What a select property offers when it has no options of its own. */
export const SELECT_PRESET_OPTIONS = ["Not started", "In progress", "Published", "Archived"];

const MAX_OPTIONS = 20;
const MAX_OPTION_LENGTH = 40;

/**
 * Turns a comma-separated string ("Low, Medium, High") into a clean option
 * list: trimmed, empties dropped, duplicates removed (case-insensitively,
 * first spelling wins), and capped so one property can't grow an unusable
 * dropdown.
 */
export function parseOptionList(input: string): string[] {
  const seen = new Set<string>();
  const options: string[] = [];
  for (const raw of input.split(",")) {
    const option = raw.trim().replace(/\s+/g, " ").slice(0, MAX_OPTION_LENGTH).trim();
    const key = option.toLowerCase();
    if (!option || seen.has(key)) continue;
    seen.add(key);
    options.push(option);
    if (options.length === MAX_OPTIONS) break;
  }
  return options;
}

/**
 * The choices to show for a select property. If its current value isn't
 * among them (the options were edited after that value was picked), it's
 * kept as an extra entry rather than silently vanishing from the dropdown.
 */
export function getSelectOptions(property: Pick<PageProperty, "options" | "value">): string[] {
  const base = property.options?.length ? property.options : SELECT_PRESET_OPTIONS;
  const current = property.value;
  return typeof current === "string" && current && !base.includes(current)
    ? [...base, current]
    : base;
}
