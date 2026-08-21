import type { Block, BlockType, Page } from "@/types/entities";

let counter = 0;
/** Deterministic-enough unique id for test fixtures, without pulling in crypto.randomUUID. */
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function makePage(overrides: Partial<Page> = {}): Page {
  return {
    id: nextId("page"),
    workspaceId: "ws-1",
    parentId: null,
    title: "Untitled",
    isFavorite: false,
    order: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeBlock(
  type: BlockType,
  content: Block["content"],
  overrides: Partial<Block> = {},
): Block {
  return {
    id: nextId("block"),
    pageId: "page-1",
    parentBlockId: null,
    type,
    content,
    order: 0,
    ...overrides,
  };
}
