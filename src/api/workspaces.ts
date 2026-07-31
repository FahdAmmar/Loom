import { ApiError } from "@/api/client";
import { mockDb, networkDelay } from "@/api/_mockDb";
import type { Workspace } from "@/types/entities";

export async function getWorkspace(id: string): Promise<Workspace> {
  await networkDelay();
  const workspace = mockDb.read().workspaces[id];
  if (!workspace) throw new ApiError(`No workspace found with id "${id}".`, 404);
  return workspace;
}
