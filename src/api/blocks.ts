import { ApiError } from "@/api/client";
import { mockDb, networkDelay } from "@/api/_mockDb";
import { getDescendantBlockIds, getOrderedBlocks } from "@/lib/blocks";
import { arrayMove } from "@/lib/utils";
import type { Block, BlockType } from "@/types/entities";

export async function listBlocks(pageId: string): Promise<Block[]> {
  await networkDelay();
  return Object.values(mockDb.read().blocks).filter((b) => b.pageId === pageId);
}

export interface CreateBlockInput {
  pageId: string;
  type: BlockType;
  content: Block["content"];
  parentBlockId?: string | null;
  /** Insert immediately after this block's id; omit to append at the end. */
  afterBlockId?: string | null;
}

export async function createBlock(input: CreateBlockInput): Promise<Block> {
  await networkDelay(120);
  const db = mockDb.read();
  const parentBlockId = input.parentBlockId ?? null;
  const siblings = getOrderedBlocks(db.blocks, input.pageId, parentBlockId);

  const afterIndex = input.afterBlockId
    ? siblings.findIndex((b) => b.id === input.afterBlockId)
    : siblings.length - 1;
  const order = afterIndex === -1 ? siblings.length : afterIndex + 1;

  // Make room: bump order of every sibling at or after the insertion point.
  for (const sibling of siblings) {
    if (sibling.order >= order) {
      db.blocks[sibling.id] = { ...sibling, order: sibling.order + 1 };
    }
  }

  const newBlock: Block = {
    id: `block-${crypto.randomUUID()}`,
    pageId: input.pageId,
    parentBlockId,
    type: input.type,
    content: input.content,
    order,
  };
  db.blocks[newBlock.id] = newBlock;
  mockDb.write(db);
  return newBlock;
}

/** Appends many top-level blocks to a page in one round trip, in the
 * given order — used by Markdown import, which would otherwise need one
 * `createBlock` call per block (the same N+1 concern
 * `pageProperties.ts`'s `addPropertyToPages` already solved for table
 * columns). */
export async function createBlocks(
  pageId: string,
  drafts: { type: BlockType; content: Block["content"] }[],
): Promise<Block[]> {
  await networkDelay(150);
  const db = mockDb.read();
  const startOrder = getOrderedBlocks(db.blocks, pageId, null).length;

  const created = drafts.map((draft, index): Block => ({
    id: `block-${crypto.randomUUID()}`,
    pageId,
    parentBlockId: null,
    type: draft.type,
    content: draft.content,
    order: startOrder + index,
  }));
  for (const block of created) db.blocks[block.id] = block;
  mockDb.write(db);
  return created;
}

export async function updateBlock(
  id: string,
  changes: Partial<Pick<Block, "type" | "content">>,
): Promise<Block> {
  await networkDelay(90);
  const db = mockDb.read();
  const existing = db.blocks[id];
  if (!existing) throw new ApiError(`No block found with id "${id}".`, 404);

  const updated: Block = { ...existing, ...changes };
  db.blocks[id] = updated;
  mockDb.write(db);
  return updated;
}

export async function deleteBlock(id: string): Promise<string[]> {
  await networkDelay(120);
  const db = mockDb.read();
  if (!db.blocks[id]) throw new ApiError(`No block found with id "${id}".`, 404);

  const idsToRemove = [id, ...getDescendantBlockIds(db.blocks, id)];
  const idSet = new Set(idsToRemove);

  for (const removedId of idsToRemove) delete db.blocks[removedId];
  for (const link of Object.values(db.links)) {
    if (link.sourceBlockId && idSet.has(link.sourceBlockId)) delete db.links[link.id];
  }

  mockDb.write(db);
  return idsToRemove;
}

/** Swaps a block's order with its previous/next sibling. Returns both updated blocks. */
export async function moveBlock(id: string, direction: "up" | "down"): Promise<Block[]> {
  await networkDelay(90);
  const db = mockDb.read();
  const target = db.blocks[id];
  if (!target) throw new ApiError(`No block found with id "${id}".`, 404);

  const siblings = getOrderedBlocks(db.blocks, target.pageId, target.parentBlockId);
  const index = siblings.findIndex((b) => b.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return [target];

  const swapWith = siblings[swapIndex];
  const updatedTarget: Block = { ...target, order: swapWith.order };
  const updatedSwap: Block = { ...swapWith, order: target.order };
  db.blocks[updatedTarget.id] = updatedTarget;
  db.blocks[updatedSwap.id] = updatedSwap;
  mockDb.write(db);
  return [updatedTarget, updatedSwap];
}

/**
 * Moves a block to `newIndex` among its current siblings (same page +
 * parentBlockId) — an arbitrary-distance move, unlike moveBlock's
 * adjacent-only swap. Built for drag-and-drop, where a block can land
 * several positions away in one gesture. Returns every sibling whose order
 * changed, re-normalized to a contiguous 0..n-1 sequence.
 */
/**
 * Moves a block to sit at `targetIndex` — that index measured in the
 * block's *current* sibling order (same page + parentBlockId), i.e.
 * exactly the target's raw position a caller already has on hand from a
 * drag-and-drop drop event. Unlike moveBlock's adjacent-only swap, this can
 * jump several positions in one call. Returns every sibling whose order
 * changed, re-normalized to a contiguous 0..n-1 sequence.
 */
export async function reorderBlock(id: string, targetIndex: number): Promise<Block[]> {
  await networkDelay(90);
  const db = mockDb.read();
  const target = db.blocks[id];
  if (!target) throw new ApiError(`No block found with id "${id}".`, 404);

  const siblings = getOrderedBlocks(db.blocks, target.pageId, target.parentBlockId);
  const oldIndex = siblings.findIndex((b) => b.id === id);
  if (oldIndex === -1 || oldIndex === targetIndex) return [];

  const reordered = arrayMove(siblings, oldIndex, targetIndex);
  const updated = reordered.map((block, index) => Object.assign(block, { order: index }));
  for (const block of updated) db.blocks[block.id] = block;
  mockDb.write(db);
  return updated;
}
