import { Smile, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// A small, curated set rather than a full searchable-emoji package — this
// is a light-touch "give a page a face" feature, not an emoji keyboard, so
// pulling in a large dependency for it would be the wrong trade.
const ICON_OPTIONS = [
  "📄",
  "📝",
  "📋",
  "📌",
  "💡",
  "🎯",
  "🚀",
  "📚",
  "🗂️",
  "📅",
  "✅",
  "🔥",
  "⭐",
  "🎨",
  "🛠️",
  "🐛",
  "📊",
  "💬",
  "🌱",
  "🏠",
  "❤️",
  "🎉",
  "🔖",
  "📁",
];

interface IconPickerProps {
  icon?: string;
  onChange: (icon: string | undefined) => void;
}

export function IconPicker({ icon, onChange }: IconPickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={icon ? `Change page icon (currently ${icon})` : "Add a page icon"}
          className="hover:bg-accent flex size-9 shrink-0 items-center justify-center rounded-md text-xl"
        >
          {icon ?? <Smile className="text-muted-foreground size-4.5" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="grid grid-cols-8 gap-0.5 p-1">
          {ICON_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option}
              onSelect={() => onChange(option)}
              className="flex items-center justify-center p-1.5 text-lg"
            >
              {option}
            </DropdownMenuItem>
          ))}
        </div>
        {icon && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange(undefined)}>
              <X className="size-3.5" />
              Remove icon
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
