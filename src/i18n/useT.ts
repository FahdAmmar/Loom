import { useCallback } from "react";

import { localeFromDirection, translate, type MessageKey, type MessageParams } from "@/i18n";
import { useSettingsStore } from "@/stores/useSettingsStore";

/** `t("key", { name })` in the current interface language; re-renders when it changes. */
export function useT() {
  const locale = useSettingsStore((s) => localeFromDirection(s.direction));
  return useCallback(
    (key: MessageKey, params?: MessageParams) => translate(locale, key, params),
    [locale],
  );
}
