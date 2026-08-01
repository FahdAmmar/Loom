import type { Block, Page, Workspace } from "@/types/entities";

const STORAGE_KEY = "loom-mock-db-v1";
const DEFAULT_WORKSPACE_ID = "default";

interface MockDb {
  workspaces: Record<string, Workspace>;
  pages: Record<string, Page>;
  blocks: Record<string, Block>;
}

let blockOrder = 0;
function block(pageId: string, type: Block["type"], content: Block["content"]): Block {
  return {
    id: `block-${crypto.randomUUID()}`,
    pageId,
    parentBlockId: null,
    type,
    content,
    order: blockOrder++,
  };
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

  blockOrder = 0;
  const welcomeBlocks = [
    block(welcome.id, "heading1", { html: "Welcome to Loom" }),
    block(welcome.id, "paragraph", {
      html: "This page is a <strong>block editor</strong> — every paragraph, heading, and list item below is its own block. Try typing <code>/</code> on a new line to see the command menu.",
    }),
    block(welcome.id, "callout", {
      html: "Linking pages together with <code>[[double brackets]]</code> and the visual graph arrive in Phase 4 — this phase is just about getting words on the page.",
    }),
    block(welcome.id, "heading2", { html: "What you can do here" }),
    block(welcome.id, "bulletList", { html: "Write in paragraphs, headings, and lists" }),
    block(welcome.id, "bulletList", {
      html: "Use <strong>bold</strong>, <em>italic</em>, and <code>inline code</code>",
    }),
    block(welcome.id, "checklist", { html: "Check things off as you go", checked: true }),
    block(welcome.id, "checklist", { html: "This one's still open", checked: false }),
    block(welcome.id, "quote", {
      html: "A page is just a list of blocks. That's the whole trick.",
    }),
    block(welcome.id, "code", {
      code: "// blocks are plain data — this whole page is an array of these\ninterface Block {\n  type: BlockType;\n  content: Record<string, unknown>;\n}",
      language: "ts",
    }),
  ];

  blockOrder = 0;
  const gettingStartedBlocks = [
    block(gettingStarted.id, "paragraph", {
      html: "Click the <strong>+</strong> next to any page in the sidebar to add a sub-page, or the <strong>/</strong> menu here to add a new kind of block.",
    }),
  ];

  return {
    workspaces: { [workspace.id]: workspace },
    pages: {
      [welcome.id]: welcome,
      [gettingStarted.id]: gettingStarted,
      [whyTwoIdeas.id]: whyTwoIdeas,
      [ideas.id]: ideas,
    },
    blocks: Object.fromEntries(
      [...welcomeBlocks, ...gettingStartedBlocks].map((b) => [b.id, b]),
    ),
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
    const parsed = JSON.parse(raw) as Partial<MockDb>;
    // Defensive against the Phase 2 schema, which had no `blocks` table yet.
    if (!parsed.blocks) parsed.blocks = {};
    return parsed as MockDb;
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
