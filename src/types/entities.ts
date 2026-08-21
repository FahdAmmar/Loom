/**
 * Persisted domain entities. Backlinks and graph nodes/edges are
 * deliberately absent here — they are derived views computed from
 * Page + Link at read time, not stored tables. See api/links.ts
 * (BacklinkResult) and features/graph/computeGraphLayout.ts.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: User["id"];
  icon?: string;
  createdAt: string;
}

export interface Page {
  id: string;
  workspaceId: Workspace["id"];
  parentId: Page["id"] | null;
  title: string;
  icon?: string;
  isFavorite: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulletList"
  | "numberedList"
  | "checklist"
  | "quote"
  | "code"
  | "callout"
  | "toggle"
  | "divider"
  | "image"
  | "table"
  | "board";

export interface Block {
  id: string;
  pageId: Page["id"];
  parentBlockId: Block["id"] | null;
  type: BlockType;
  /** Shape depends on `type`; kept loose on purpose at this layer. */
  content: Record<string, unknown>;
  order: number;
}

/**
 * Content shape for a "board" block — a small Kanban view nested inside a
 * page, e.g. `content: { columns: BoardColumn[] }`. Not a persisted entity
 * of its own (no separate table): the whole board lives in one block's
 * `content`, the same way a "table" block's rows do.
 */
export interface BoardCard {
  id: string;
  title: string;
  /** A single emoji shown before the title, e.g. "🚀". Optional. */
  icon?: string;
}

export interface BoardColumn {
  id: string;
  title: string;
  color: "gold" | "violet" | "mint";
  /** A single emoji shown before the column title, e.g. "✅". Optional. */
  icon?: string;
  cards: BoardCard[];
}

export interface Tag {
  id: string;
  workspaceId: Workspace["id"];
  name: string;
  color: string;
}

/** Implicit many-to-many join between Page and Tag. */
export interface PageTag {
  pageId: Page["id"];
  tagId: Tag["id"];
}

export type PagePropertyType = "text" | "number" | "date" | "select" | "checkbox";

export interface PageProperty {
  id: string;
  pageId: Page["id"];
  key: string;
  type: PagePropertyType;
  value: string | number | boolean | null;
}

/**
 * A directed [[wikilink]] edge. Backlinks for a page are computed by
 * filtering this table on `targetPageId` — never stored twice.
 */
export interface Link {
  id: string;
  sourcePageId: Page["id"];
  targetPageId: Page["id"];
  sourceBlockId?: Block["id"];
}

export interface Template {
  id: string;
  workspaceId: Workspace["id"];
  name: string;
  icon?: string;
  blocks: Pick<Block, "type" | "content" | "order">[];
}
