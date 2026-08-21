import { ApiError } from "@/api/client";
import { mockDb, networkDelay } from "@/api/_mockDb";
import type {
  Block,
  Link,
  Page,
  PageProperty,
  PageTag,
  Tag,
  Template,
  Workspace,
} from "@/types/entities";

/** Bumped only if the shape below changes in a way old files can't be read as. */
const EXPORT_FORMAT_VERSION = 1;

export interface WorkspaceExport {
  formatVersion: number;
  exportedAt: string;
  workspace: Workspace;
  pages: Page[];
  blocks: Block[];
  links: Link[];
  tags: Tag[];
  pageTags: PageTag[];
  pageProperties: PageProperty[];
  templates: Template[];
}

/** Every table, filtered down to one workspace, as plain arrays — a portable
 * shape to hand to JSON.stringify, independent of how it's keyed in storage. */
export async function exportWorkspace(workspaceId: string): Promise<WorkspaceExport> {
  await networkDelay(150);
  const db = mockDb.read();
  const workspace = db.workspaces[workspaceId];
  if (!workspace) throw new ApiError(`No workspace found with id "${workspaceId}".`, 404);

  const pages = Object.values(db.pages).filter((p) => p.workspaceId === workspaceId);
  const pageIds = new Set(pages.map((p) => p.id));

  return {
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    workspace,
    pages,
    blocks: Object.values(db.blocks).filter((b) => pageIds.has(b.pageId)),
    links: Object.values(db.links).filter((l) => pageIds.has(l.sourcePageId)),
    tags: Object.values(db.tags).filter((t) => t.workspaceId === workspaceId),
    pageTags: Object.values(db.pageTags).filter((pt) => pageIds.has(pt.pageId)),
    pageProperties: Object.values(db.pageProperties).filter((p) => pageIds.has(p.pageId)),
    templates: Object.values(db.templates).filter((t) => t.workspaceId === workspaceId),
  };
}

/** A structural check, not full schema validation — enough to catch "wrong
 * file entirely" without hand-rolling a JSON schema validator for a
 * single-user local import. */
export function parseWorkspaceExport(raw: string): WorkspaceExport {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new ApiError("That file isn't valid JSON.");
  }
  const v = data as Partial<WorkspaceExport> | null;
  if (
    !v ||
    typeof v.formatVersion !== "number" ||
    !v.workspace ||
    !Array.isArray(v.pages) ||
    !Array.isArray(v.blocks)
  ) {
    throw new ApiError("That file doesn't look like a Loom workspace export.");
  }
  if (v.formatVersion > EXPORT_FORMAT_VERSION) {
    throw new ApiError("This file was exported by a newer version of Loom.");
  }
  return v as WorkspaceExport;
}

/**
 * Replaces every page (and its blocks/links/tags/properties) currently in
 * `workspaceId` with the contents of `data` — a restore, not a merge, so
 * importing the same file twice can't create duplicates or dangling
 * cross-references from a partial overlap.
 */
export async function importWorkspace(
  data: WorkspaceExport,
  workspaceId: string,
): Promise<void> {
  await networkDelay(250);
  const db = mockDb.read();

  const existingPageIds = new Set(
    Object.values(db.pages)
      .filter((p) => p.workspaceId === workspaceId)
      .map((p) => p.id),
  );
  for (const id of Object.keys(db.pages)) {
    if (existingPageIds.has(id)) delete db.pages[id];
  }
  for (const id of Object.keys(db.blocks)) {
    if (existingPageIds.has(db.blocks[id].pageId)) delete db.blocks[id];
  }
  for (const id of Object.keys(db.links)) {
    if (existingPageIds.has(db.links[id].sourcePageId)) delete db.links[id];
  }
  for (const id of Object.keys(db.pageTags)) {
    if (existingPageIds.has(db.pageTags[id].pageId)) delete db.pageTags[id];
  }
  for (const id of Object.keys(db.pageProperties)) {
    if (existingPageIds.has(db.pageProperties[id].pageId)) delete db.pageProperties[id];
  }
  for (const [id, tag] of Object.entries(db.tags)) {
    if (tag.workspaceId === workspaceId) delete db.tags[id];
  }
  for (const [id, template] of Object.entries(db.templates)) {
    if (template.workspaceId === workspaceId) delete db.templates[id];
  }

  // Re-point every imported record at the target workspace rather than
  // trusting the id inside the file — importing into a different workspace
  // than the one it was exported from should still work.
  db.workspaces[workspaceId] = { ...data.workspace, id: workspaceId };
  for (const page of data.pages) db.pages[page.id] = { ...page, workspaceId };
  for (const b of data.blocks) db.blocks[b.id] = b;
  for (const link of data.links) db.links[link.id] = link;
  for (const tag of data.tags) db.tags[tag.id] = { ...tag, workspaceId };
  for (const pageTag of data.pageTags) {
    db.pageTags[`${pageTag.pageId}:${pageTag.tagId}`] = pageTag;
  }
  for (const prop of data.pageProperties) db.pageProperties[prop.id] = prop;
  for (const template of data.templates)
    db.templates[template.id] = { ...template, workspaceId };

  mockDb.write(db);
}

/** Overwrites everything with the built-in demo content — the quickest way
 * back to a known-good state, without needing to clear browser storage
 * by hand (e.g. after experimenting with import). */
export async function resetWorkspaceToDemoContent(): Promise<void> {
  await networkDelay(250);
  mockDb.resetToDemo();
}
