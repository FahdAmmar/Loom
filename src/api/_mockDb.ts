import { extractPageLinkIdsFromHtml } from "@/lib/blocks";
import type { Block, Link, Page, Workspace } from "@/types/entities";

const STORAGE_KEY = "loom-mock-db-v1";
const DEFAULT_WORKSPACE_ID = "default";

interface MockDb {
  workspaces: Record<string, Workspace>;
  pages: Record<string, Page>;
  blocks: Record<string, Block>;
  links: Record<string, Link>;
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

/** Matches exactly what the pageLink Tiptap node renders — see features/editor/nodes/pageLinkNode.ts. */
function pageLinkHtml(page: Page): string {
  return `<span data-page-link data-page-id="${page.id}" class="page-link-chip">↗ ${page.title}</span>`;
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
      html: `Type <code>[[</code> anywhere to link to another page — try it, or follow the one already here: ${pageLinkHtml(gettingStarted)}.`,
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
    block(welcome.id, "paragraph", {
      html: `See also: ${pageLinkHtml(whyTwoIdeas)} and ${pageLinkHtml(ideas)}.`,
    }),
  ];

  blockOrder = 0;
  const gettingStartedBlocks = [
    block(gettingStarted.id, "paragraph", {
      html: `Click the <strong>+</strong> next to any page in the sidebar to add a sub-page, or the <strong>/</strong> menu here to add a new kind of block. Head back to ${pageLinkHtml(welcome)} any time.`,
    }),
  ];

  blockOrder = 0;
  const ideasBlocks = [
    block(ideas.id, "paragraph", {
      html: `A loose page, not nested under anything — but still linked from ${pageLinkHtml(welcome)}. The graph in Phase 4 draws connections like this one regardless of where a page sits in the tree.`,
    }),
  ];

  const allBlocks = [...welcomeBlocks, ...gettingStartedBlocks, ...ideasBlocks];

  const links: Record<string, Link> = {};
  for (const b of allBlocks) {
    if (typeof b.content.html !== "string") continue;
    for (const targetPageId of extractPageLinkIdsFromHtml(b.content.html)) {
      if (targetPageId === b.pageId) continue; // no self-links
      const link: Link = {
        id: `link-${crypto.randomUUID()}`,
        sourcePageId: b.pageId,
        targetPageId,
        sourceBlockId: b.id,
      };
      links[link.id] = link;
    }
  }

  return {
    workspaces: { [workspace.id]: workspace },
    pages: {
      [welcome.id]: welcome,
      [gettingStarted.id]: gettingStarted,
      [whyTwoIdeas.id]: whyTwoIdeas,
      [ideas.id]: ideas,
    },
    blocks: Object.fromEntries(allBlocks.map((b) => [b.id, b])),
    links,
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
    // Defensive against older schemas that predate a table.
    if (!parsed.blocks) parsed.blocks = {};
    if (!parsed.links) parsed.links = {};
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
