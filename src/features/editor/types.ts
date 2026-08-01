import type { SlashState } from "@/features/editor/components/BlockTextEditor";

export interface BlockEditingHandlers {
  onChange: (html: string) => void;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
  onArrowUp: () => void;
  onArrowDown: () => void;
  onSlashStateChange: (state: SlashState) => void;
  onSlashKeyDown: (key: string) => boolean;
}
