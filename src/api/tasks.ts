import { ApiError } from "@/api/client";
import { mockDb, networkDelay } from "@/api/_mockDb";
import { collectTasks, type Task } from "@/lib/tasks";

/** Checklist items across every live page in the workspace. */
export async function listTasks(workspaceId: string): Promise<Task[]> {
  await networkDelay();
  const db = mockDb.read();
  const pagesById = Object.fromEntries(
    Object.values(db.pages)
      .filter((p) => p.workspaceId === workspaceId)
      .map((p) => [p.id, p]),
  );
  const blocks = Object.values(db.blocks).sort((a, b) => a.order - b.order);
  return collectTasks(blocks, pagesById);
}

export async function setTaskChecked(blockId: string, checked: boolean): Promise<void> {
  await networkDelay(90);
  const db = mockDb.read();
  const block = db.blocks[blockId];
  if (!block || block.type !== "checklist") {
    throw new ApiError(`No checklist item found with id "${blockId}".`, 404);
  }
  db.blocks[blockId] = { ...block, content: { ...block.content, checked } };
  mockDb.write(db);
}
