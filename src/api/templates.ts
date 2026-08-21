import { ApiError } from "@/api/client";
import { mockDb, networkDelay } from "@/api/_mockDb";
import { getOrderedBlocks } from "@/lib/blocks";
import type { Page, Template } from "@/types/entities";

export async function listTemplates(workspaceId: string): Promise<Template[]> {
  await networkDelay();
  return Object.values(mockDb.read().templates).filter((t) => t.workspaceId === workspaceId);
}

export async function createTemplateFromPage(
  pageId: string,
  workspaceId: string,
  name: string,
): Promise<Template> {
  await networkDelay(150);
  const db = mockDb.read();
  const page = db.pages[pageId];
  if (!page) throw new ApiError(`No page found with id "${pageId}".`, 404);

  // Only top-level blocks — Template.blocks has no parent-child shape yet,
  // so a toggle's nested children don't carry over into the template.
  const topLevelBlocks = getOrderedBlocks(db.blocks, pageId, null);

  const template: Template = {
    id: `template-${crypto.randomUUID()}`,
    workspaceId,
    name: name.trim() || "Untitled template",
    blocks: topLevelBlocks.map((b) => ({ type: b.type, content: b.content, order: b.order })),
  };
  db.templates[template.id] = template;
  mockDb.write(db);
  return template;
}

export async function deleteTemplate(id: string): Promise<void> {
  await networkDelay();
  const db = mockDb.read();
  delete db.templates[id];
  mockDb.write(db);
}

export async function createPageFromTemplate(
  templateId: string,
  workspaceId: string,
  parentId: string | null,
): Promise<Page> {
  await networkDelay(200);
  const db = mockDb.read();
  const template = db.templates[templateId];
  if (!template) throw new ApiError(`No template found with id "${templateId}".`, 404);

  const now = new Date().toISOString();
  const siblingCount = Object.values(db.pages).filter(
    (p) => p.workspaceId === workspaceId && p.parentId === parentId,
  ).length;

  const page: Page = {
    id: `page-${crypto.randomUUID()}`,
    workspaceId,
    parentId,
    title: template.name,
    isFavorite: false,
    order: siblingCount,
    createdAt: now,
    updatedAt: now,
  };
  db.pages[page.id] = page;

  for (const templateBlock of template.blocks) {
    const id = `block-${crypto.randomUUID()}`;
    db.blocks[id] = {
      id,
      pageId: page.id,
      parentBlockId: null,
      type: templateBlock.type,
      content: templateBlock.content,
      order: templateBlock.order,
    };
  }

  mockDb.write(db);
  return page;
}
