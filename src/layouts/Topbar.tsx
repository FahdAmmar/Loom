import { Menu, Moon, Search, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/stores/useSidebarStore";
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
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="border-border bg-background/85 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-md">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open navigation"
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
        size="sm"
        className="text-muted-foreground hidden gap-2 sm:inline-flex"
        disabled
        title="Search and the command palette arrive in Phase 5"
        aria-disabled="true"
      >
        <Search className="size-3.5" />
        Search
        <kbd className="border-border text-text-faint ml-1 rounded border px-1.5 py-0.5 font-mono text-[10px]">
          Phase 5
        </kbd>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle color theme"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </header>
  );
}
