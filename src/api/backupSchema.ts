import { z } from "zod";

// Loose objects keep fields a newer app version may add instead of stripping them.
const id = z.string().min(1);
const isoDate = z.string().min(1);
const blockType = z.enum([
  "paragraph",
  "heading1",
  "heading2",
  "heading3",
  "bulletList",
  "numberedList",
  "checklist",
  "quote",
  "code",
  "callout",
  "toggle",
  "divider",
  "image",
  "table",
  "board",
  "file",
  "embed",
  "math",
  "database",
]);

const workspace = z.looseObject({
  id,
  name: z.string(),
  ownerId: id,
  icon: z.string().optional(),
  createdAt: isoDate,
});

const page = z.looseObject({
  id,
  workspaceId: id,
  parentId: id.nullable(),
  title: z.string(),
  icon: z.string().optional(),
  cover: z.string().optional(),
  isFavorite: z.boolean(),
  dailyNoteDate: z.string().optional(),
  deletedAt: z.string().optional(),
  order: z.number(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

const block = z.looseObject({
  id,
  pageId: id,
  parentBlockId: id.nullable(),
  type: blockType,
  content: z.record(z.string(), z.unknown()),
  order: z.number(),
});

const link = z.looseObject({
  id,
  sourcePageId: id,
  targetPageId: id,
  sourceBlockId: z.string().optional(),
});

const tag = z.looseObject({ id, workspaceId: id, name: z.string(), color: z.string() });
const pageTag = z.looseObject({ pageId: id, tagId: id });

const pageProperty = z.looseObject({
  id,
  pageId: id,
  key: z.string(),
  type: z.enum(["text", "number", "date", "select", "checkbox"]),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  options: z.array(z.string()).optional(),
});

interface TemplateBlockShape {
  type: z.infer<typeof blockType>;
  content: Record<string, unknown>;
  order: number;
  children: TemplateBlockShape[];
}

const templateBlock: z.ZodType<TemplateBlockShape> = z.lazy(() =>
  z.looseObject({
    type: blockType,
    content: z.record(z.string(), z.unknown()),
    order: z.number(),
    children: z.array(templateBlock),
  }),
);

const template = z.looseObject({
  id,
  workspaceId: id,
  name: z.string(),
  icon: z.string().optional(),
  blocks: z.array(templateBlock),
});

export const workspaceExportSchema = z.looseObject({
  formatVersion: z.number().int().min(1),
  exportedAt: z.string(),
  workspace,
  pages: z.array(page),
  blocks: z.array(block),
  // Older exports may omit the secondary tables.
  links: z.array(link).default([]),
  tags: z.array(tag).default([]),
  pageTags: z.array(pageTag).default([]),
  pageProperties: z.array(pageProperty).default([]),
  templates: z.array(template).default([]),
});

/** A short, human-readable location such as `pages[3].title`. */
export function describeIssue(issue: z.core.$ZodIssue): string {
  let path = "";
  for (const part of issue.path) {
    if (typeof part === "number") path += `[${part}]`;
    else path += path ? `.${String(part)}` : String(part);
  }
  return path ? `${path}: ${issue.message}` : issue.message;
}
