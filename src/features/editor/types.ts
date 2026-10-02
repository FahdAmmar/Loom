import type { SlashState } from "@/features/editor/components/BlockTextEditor";
import type { PasteData } from "@/lib/paste";

export interface BlockEditingHandlers {
  onChange: (html: string) => void;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
  onArrowUp: () => void;
  onArrowDown: () => void;
  onSlashStateChange: (state: SlashState) => void;
  onSlashKeyDown: (key: string) => boolean;
  /** Return true when the paste was fully handled (the editor then skips its own). */
  onPaste?: (data: PasteData) => boolean;
  /** Esc inside a text block: leave the caret and select the block instead. */
  onEscape?: () => void;
}
