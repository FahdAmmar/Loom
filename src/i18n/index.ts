import { ar } from "./ar";
import { en, type MessageKey } from "./en";

export type { MessageKey };
export type Locale = "en" | "ar";

const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, ar };

export type MessageParams = Record<string, string | number>;

/** Falls back to English for a missing entry, and leaves an unknown `{placeholder}` visible. */
export function translate(locale: Locale, key: MessageKey, params?: MessageParams): string {
  const template = MESSAGES[locale][key] ?? en[key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
}

/** The interface language follows the layout direction chosen in Settings. */
export function localeFromDirection(direction: "ltr" | "rtl"): Locale {
  return direction === "rtl" ? "ar" : "en";
}
