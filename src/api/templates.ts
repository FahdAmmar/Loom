import { ApiError } from "@/api/client";
import { mockDb, networkDelay } from "@/api/_mockDb";
import { getOrderedBlocks } from "@/lib/blocks";
import type { Block, Page, Template, TemplateBlock } from "@/types/entities";

/** Recursively captures a block and its descendants (via parentBlockId) into template shape. */
function buildTemplateBlockTree(
  blocksById: Record<string, Block>,
  pageId: string,
  parentBlockId: string | null,
): TemplateBlock[] {
  return getOrderedBlocks(blocksById, pageId, parentBlockId).map((block) => ({
    type: block.type,
    content: block.content,
    order: block.order,
    children: buildTemplateBlockTree(blocksById, pageId, block.id),
  }));
}

/** Recursively instantiates a template's block tree onto a new page, generating fresh ids and remapping parentBlockId at every level. */
function instantiateTemplateBlocks(
  templateBlocks: TemplateBlock[],
  pageId: string,
  parentBlockId: string | null,
  db: ReturnType<typeof mockDb.read>,
) {
  for (const templateBlock of templateBlocks) {
    const id = `block-${crypto.randomUUID()}`;
    db.blocks[id] = {
      id,
      pageId,
      parentBlockId,
      type: templateBlock.type,
      content: templateBlock.content,
      order: templateBlock.order,
    };
    instantiateTemplateBlocks(templateBlock.children, pageId, id, db);
  }
}

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

  const template: Template = {
    id: `template-${crypto.randomUUID()}`,
    workspaceId,
    name: name.trim() || "Untitled template",
    blocks: buildTemplateBlockTree(db.blocks, pageId, null),
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
  instantiateTemplateBlocks(template.blocks, page.id, null, db);

  mockDb.write(db);
  return page;
}
