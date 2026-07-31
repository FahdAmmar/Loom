import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import type { ThemePreference } from "@/stores/useSettingsStore";

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function SettingsRoute() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Account and workspace preferences land here as later phases add them. Appearance is
        wired up now.
      </p>

      <section className="mt-8">
        <h2 className="text-foreground text-sm font-medium">Appearance</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Choose how Loom looks. "System" follows your OS setting automatically.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:max-w-sm">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              aria-pressed={theme === value}
              variant={theme === value ? "default" : "outline"}
              className="h-auto flex-col gap-1.5 py-4"
              onClick={() => setTheme(value)}
            >
              <Icon className="size-4" />
              {label}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
