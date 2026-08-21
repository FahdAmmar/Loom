import {
  ChevronRight,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  KanbanSquare,
  List,
  ListChecks,
  ListOrdered,
  Megaphone,
  Minus,
  Quote,
  Table as TableIcon,
  Type,
} from "lucide-react";
import type { ComponentType } from "react";

import type { Block, BlockType } from "@/types/entities";

export interface SlashCommandDef {
  type: BlockType;
  label: string;
  keywords: string[];
  icon: ComponentType<{ className?: string }>;
  emptyContent: () => Block["content"];
}

export const SLASH_COMMANDS: SlashCommandDef[] = [
  {
    type: "paragraph",
    label: "Text",
    keywords: ["text", "paragraph"],
    icon: Type,
    emptyContent: () => ({ html: "" }),
  },
  {
    type: "heading1",
    label: "Heading 1",
    keywords: ["h1", "heading", "title"],
    icon: Heading1,
    emptyContent: () => ({ html: "" }),
  },
  {
    type: "heading2",
    label: "Heading 2",
    keywords: ["h2", "heading", "subtitle"],
    icon: Heading2,
    emptyContent: () => ({ html: "" }),
  },
  {
    type: "heading3",
    label: "Heading 3",
    keywords: ["h3", "heading"],
    icon: Heading3,
    emptyContent: () => ({ html: "" }),
  },
  {
    type: "bulletList",
    label: "Bulleted list",
    keywords: ["bullet", "list", "ul"],
    icon: List,
    emptyContent: () => ({ html: "" }),
  },
  {
    type: "numberedList",
    label: "Numbered list",
    keywords: ["numbered", "ordered", "ol"],
    icon: ListOrdered,
    emptyContent: () => ({ html: "" }),
  },
  {
    type: "checklist",
    label: "Checklist",
    keywords: ["todo", "checkbox", "task"],
    icon: ListChecks,
    emptyContent: () => ({ html: "", checked: false }),
  },
  {
    type: "quote",
    label: "Quote",
    keywords: ["quote", "blockquote"],
    icon: Quote,
    emptyContent: () => ({ html: "" }),
  },
  {
    type: "callout",
    label: "Callout",
    keywords: ["callout", "note", "tip"],
    icon: Megaphone,
    emptyContent: () => ({ html: "" }),
  },
  {
    type: "code",
    label: "Code",
    keywords: ["code", "snippet"],
    icon: Code2,
    emptyContent: () => ({ code: "", language: "" }),
  },
  {
    type: "toggle",
    label: "Toggle",
    keywords: ["toggle", "collapse", "expand"],
    icon: ChevronRight,
    emptyContent: () => ({ html: "" }),
  },
  {
    type: "divider",
    label: "Divider",
    keywords: ["divider", "hr", "separator", "line"],
    icon: Minus,
    emptyContent: () => ({}),
  },
  {
    type: "image",
    label: "Image",
    keywords: ["image", "picture", "img"],
    icon: ImageIcon,
    emptyContent: () => ({ url: "" }),
  },
  {
    type: "table",
    label: "Table",
    keywords: ["table", "grid"],
    icon: TableIcon,
    emptyContent: () => ({
      rows: [
        ["", ""],
        ["", ""],
      ],
    }),
  },
  {
    type: "board",
    label: "Board",
    keywords: ["board", "kanban", "todo", "tasks"],
    icon: KanbanSquare,
    emptyContent: () => ({
      columns: [
        { id: `col-${crypto.randomUUID()}`, title: "To Do", color: "gold", cards: [] },
        { id: `col-${crypto.randomUUID()}`, title: "Doing", color: "violet", cards: [] },
        {
          id: `col-${crypto.randomUUID()}`,
          title: "Done",
          color: "mint",
          icon: "✅",
          cards: [],
        },
      ],
    }),
  },
];
