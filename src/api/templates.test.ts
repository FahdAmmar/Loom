import { beforeEach, describe, expect, it } from "vitest";

import * as blocksApi from "@/api/blocks";
import * as pagesApi from "@/api/pages";
import * as templatesApi from "@/api/templates";

const WORKSPACE_ID = "test-workspace";

beforeEach(() => {});

describe("createTemplateFromPage", () => {
  it("captures a toggle's nested children in the template tree", async () => {
    const page = await pagesApi.createPage({ workspaceId: WORKSPACE_ID, parentId: null });
    const toggle = await blocksApi.createBlock({
      pageId: page.id,
      type: "toggle",
      content: { html: "Details" },
    });
    await blocksApi.createBlock({
      pageId: page.id,
      type: "paragraph",
      content: { html: "child one" },
      parentBlockId: toggle.id,
    });
    await blocksApi.createBlock({
      pageId: page.id,
      type: "paragraph",
      content: { html: "child two" },
      parentBlockId: toggle.id,
    });

    const template = await templatesApi.createTemplateFromPage(
      page.id,
      WORKSPACE_ID,
      "My template",
    );

    expect(template.blocks).toHaveLength(1);
    expect(template.blocks[0].type).toBe("toggle");
    expect(template.blocks[0].children.map((c) => c.content.html)).toEqual([
      "child one",
      "child two",
    ]);
  });
});

describe("createPageFromTemplate", () => {
  it("re-instantiates nested blocks with fresh ids and correct parentBlockId links", async () => {
    const sourcePage = await pagesApi.createPage({ workspaceId: WORKSPACE_ID, parentId: null });
    const toggle = await blocksApi.createBlock({
      pageId: sourcePage.id,
      type: "toggle",
      content: { html: "Details" },
    });
    await blocksApi.createBlock({
      pageId: sourcePage.id,
      type: "paragraph",
      content: { html: "child" },
      parentBlockId: toggle.id,
    });
    const template = await templatesApi.createTemplateFromPage(
      sourcePage.id,
      WORKSPACE_ID,
      "My template",
    );

    const newPage = await templatesApi.createPageFromTemplate(template.id, WORKSPACE_ID, null);
    const blocks = await blocksApi.listBlocks(newPage.id);

    expect(blocks).toHaveLength(2);
    const newToggle = blocks.find((b) => b.type === "toggle");
    const newChild = blocks.find((b) => b.type === "paragraph");
    expect(newToggle?.id).not.toBe(toggle.id);
    expect(newChild?.parentBlockId).toBe(newToggle?.id);
  });
});
