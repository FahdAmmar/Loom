import { Maximize2, Menu, Moon, Search, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/useT";
import { useFocusModeStore } from "@/stores/useFocusModeStore";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { useSearchStore } from "@/stores/useSearchStore";
import { useTheme } from "@/hooks/useTheme";

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
      <circle cx="10" cy="11" r="2.6" className="fill-brand-gold" />
      <circle cx="22" cy="11" r="2.6" className="fill-brand-violet" />
      <circle cx="16" cy="22" r="2.6" className="fill-brand-mint" />
      <path
        d="M10 11L22 11M10 11L16 22M22 11L16 22"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        className="text-foreground"
      />
    </svg>
  );
}

export function Topbar() {
  const openMobile = useSidebarStore((s) => s.openMobile);
  const t = useT();
  const toggleFocusMode = useFocusModeStore((s) => s.toggle);
  const openCommandPalette = useSearchStore((s) => s.openCommandPalette);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="border-border bg-background/85 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-md print:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={t("topbar.openNav")}
        onClick={openMobile}
      >
        <Menu className="size-4" />
      </Button>

      <div className="flex items-center gap-2 font-semibold tracking-tight">
        <BrandMark />
        <span>Loom</span>
      </div>

      <div className="flex-1" />

      <Button
        variant="outline"
        size="icon"
        className="sm:hidden"
        aria-label={t("topbar.search")}
        onClick={openCommandPalette}
      >
        <Search className="size-3.5" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="text-muted-foreground hidden gap-2 sm:inline-flex"
        onClick={openCommandPalette}
      >
        <Search className="size-3.5" />
        {t("topbar.search")}
        <kbd className="border-border text-text-faint ms-1 rounded border px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={t("topbar.enterFocus")}
        title={t("topbar.focusTitle")}
        onClick={toggleFocusMode}
      >
        <Maximize2 className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={t("topbar.toggleTheme")}
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </header>
  );
}
