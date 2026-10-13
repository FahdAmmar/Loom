import { ImagePlus, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MessageKey } from "@/i18n";
import { useT } from "@/i18n/useT";
import { COVER_KEYS, COVER_PRESETS, type CoverKey } from "@/lib/covers";

interface CoverPickerProps {
  cover?: string;
  onChange: (cover: string | undefined) => void;
}

const NAME_KEYS: Record<CoverKey, MessageKey> = {
  mint: "cover.mint",
  violet: "cover.violet",
  gold: "cover.gold",
  dusk: "cover.dusk",
  ocean: "cover.ocean",
  slate: "cover.slate",
};

export function CoverPicker({ cover, onChange }: CoverPickerProps) {
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={cover ? t("cover.change") : t("cover.add")}
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-md print:hidden"
        >
          <ImagePlus className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="grid grid-cols-3 gap-2 p-2">
          {COVER_KEYS.map((key) => (
            <DropdownMenuItem
              key={key}
              onSelect={() => onChange(key)}
              aria-label={t(NAME_KEYS[key])}
              style={{ background: COVER_PRESETS[key] }}
              className={`h-10 rounded-md p-0 ${cover === key ? "ring-ring ring-2" : ""}`}
            />
          ))}
        </div>
        {cover && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange(undefined)}>
              <X className="size-3.5" />
              {t("cover.remove")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
