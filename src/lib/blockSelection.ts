import type { Block } from "@/types/entities";

/** Every block on the page in reading order (children right after their parent). */
export function orderedBlockIds(
  blocksById: Record<string, Block>,
  pageId: string,
  collapsedToggleIds: Record<string, boolean> = {},
): string[] {
  const childrenByParent = new Map<string | null, Block[]>();
  for (const block of Object.values(blocksById)) {
    if (block.pageId !== pageId) continue;
    const siblings = childrenByParent.get(block.parentBlockId) ?? [];
    siblings.push(block);
    childrenByParent.set(block.parentBlockId, siblings);
  }

  const ids: string[] = [];
  function walk(parentId: string | null) {
    const siblings = childrenByParent.get(parentId) ?? [];
    for (const block of [...siblings].sort((a, b) => a.order - b.order)) {
      ids.push(block.id);
      // Blocks hidden inside a collapsed toggle can't be clicked, so a range skips them.
      if (!(block.type === "toggle" && collapsedToggleIds[block.id])) walk(block.id);
    }
  }
  walk(null);
  return ids;
}

/** Inclusive run of ids between two blocks, whichever comes first. */
export function rangeBetween(ordered: string[], fromId: string, toId: string): string[] {
  const from = ordered.indexOf(fromId);
  const to = ordered.indexOf(toId);
  if (from === -1 || to === -1) return [toId];
  return ordered.slice(Math.min(from, to), Math.max(from, to) + 1);
}

export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
}

/**
 * Drops any selected block whose ancestor is also selected. Deleting or moving
 * the parent already takes its children along, and acting on both would fail.
 */
export function pruneNested(ids: string[], blocksById: Record<string, Block>): string[] {
  const selected = new Set(ids);
  return ids.filter((id) => {
    let parentId = blocksById[id]?.parentBlockId ?? null;
    while (parentId) {
      if (selected.has(parentId)) return false;
      parentId = blocksById[parentId]?.parentBlockId ?? null;
    }
    return true;
  });
}

/**
 * Which blocks to move one step, and in what order, so a whole selection shifts
 * as a group. Simulated on a copy: a block only moves past a neighbour that
 * isn't selected, so a contiguous run keeps its shape and stops at the edge.
 */
export function planMoves(
  siblingIds: string[],
  selectedIds: ReadonlySet<string>,
  direction: "up" | "down",
): string[] {
  const order = [...siblingIds];
  const moves: string[] = [];
  const step = direction === "up" ? -1 : 1;
  const indices = order.map((_, i) => i);
  if (direction === "down") indices.reverse();

  for (const i of indices) {
    const neighbour = i + step;
    if (!selectedIds.has(order[i]) || neighbour < 0 || neighbour >= order.length) continue;
    if (selectedIds.has(order[neighbour])) continue;
    moves.push(order[i]);
    [order[i], order[neighbour]] = [order[neighbour], order[i]];
  }
  return moves;
}
