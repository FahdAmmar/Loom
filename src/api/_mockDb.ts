import type { Page, Workspace } from "@/types/entities";

const STORAGE_KEY = "loom-mock-db-v1";
const DEFAULT_WORKSPACE_ID = "default";

interface MockDb {
  workspaces: Record<string, Workspace>;
  pages: Record<string, Page>;
}

function seedDb(): MockDb {
  const now = new Date().toISOString();
  const workspace: Workspace = {
    id: DEFAULT_WORKSPACE_ID,
    name: "My Workspace",
    ownerId: "user-1",
    createdAt: now,
  };

  const welcome: Page = {
    id: "page-welcome",
    workspaceId: DEFAULT_WORKSPACE_ID,
    parentId: null,
    title: "Welcome to Loom",
    isFavorite: false,
    order: 0,
    createdAt: now,
    updatedAt: now,
  };
  const gettingStarted: Page = {
    id: "page-getting-started",
    workspaceId: DEFAULT_WORKSPACE_ID,
    parentId: welcome.id,
    title: "Getting started",
    isFavorite: false,
    order: 0,
    createdAt: now,
    updatedAt: now,
  };
  const whyTwoIdeas: Page = {
    id: "page-why-two-ideas",
    workspaceId: DEFAULT_WORKSPACE_ID,
    parentId: welcome.id,
    title: "Why pages and a graph",
    isFavorite: false,
    order: 1,
    createdAt: now,
    updatedAt: now,
  };
  const ideas: Page = {
    id: "page-ideas",
    workspaceId: DEFAULT_WORKSPACE_ID,
    parentId: null,
    title: "Ideas",
    isFavorite: false,
    order: 1,
    createdAt: now,
    updatedAt: now,
  };

  return {
    workspaces: { [workspace.id]: workspace },
    pages: {
      [welcome.id]: welcome,
      [gettingStarted.id]: gettingStarted,
      [whyTwoIdeas.id]: whyTwoIdeas,
      [ideas.id]: ideas,
    },
  };
}

function readDb(): MockDb {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedDb();
    writeDb(seeded);
    return seeded;
  }
  try {
    return JSON.parse(raw) as MockDb;
  } catch {
    const seeded = seedDb();
    writeDb(seeded);
    return seeded;
  }
}

function writeDb(db: MockDb): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

/** Simulated network latency so loading states are exercised honestly. */
export function networkDelay(ms = 220): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockDb = {
  read: readDb,
  write: writeDb,
};
