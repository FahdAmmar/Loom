import { beforeEach, describe, expect, it } from "vitest";

import * as pagesApi from "@/api/pages";
import * as templatesApi from "@/api/templates";
import { usePageStore } from "@/stores/usePageStore";

const WS = "test-workspace";

function resetStore() {
  usePageStore.setState({
    pagesById: {},
    currentPageId: null,
    isLoading: false,
    error: null,
    recentPageIds: [],
  });
}

beforeEach(() => {
  localStorage.clear();
  resetStore();
});

describe("addPage", () => {
  it(
    "makes a page created outside createPage (e.g. from a template) immediately " +
      "visible in the store (regression: TemplatesRoute used to call " +
      "templatesApi.createPageFromTemplate directly, which persists to the mock DB " +
      "but never touched this store — PageRoute's lookup and the sidebar tree both " +
      'read from here, so the new page showed "This page doesn\'t exist" until an ' +
      "unrelated full loadPages happened to run)",
    async () => {
      const sourcePage = await pagesApi.createPage({ workspaceId: WS, parentId: null });
      const template = await templatesApi.createTemplateFromPage(
        sourcePage.id,
        WS,
        "Quick note",
      );
      const page = await templatesApi.createPageFromTemplate(template.id, WS, null);

      // Before the fix, nothing has told the store this page exists yet.
      expect(usePageStore.getState().pagesById[page.id]).toBeUndefined();

      usePageStore.getState().addPage(page);

      expect(usePageStore.getState().pagesById[page.id]).toEqual(page);
    },
  );

  it("overwrites an existing entry with the same id rather than duplicating", () => {
    const page = { ...makeMinimalPage(), id: "p1", title: "Original" };
    usePageStore.getState().addPage(page);
    usePageStore.getState().addPage({ ...page, title: "Renamed" });

    expect(Object.keys(usePageStore.getState().pagesById)).toEqual(["p1"]);
    expect(usePageStore.getState().pagesById.p1.title).toBe("Renamed");
  });
});

describe("createPage", () => {
  it("adds the created page to the store immediately", async () => {
    const page = await usePageStore.getState().createPage(WS, null, "New page");
    expect(usePageStore.getState().pagesById[page.id]?.title).toBe("New page");
  });
});

describe("deletePage", () => {
  it("removes the page from pagesById and from recentPageIds", async () => {
    const page = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    usePageStore.setState({
      pagesById: { [page.id]: page },
      recentPageIds: [page.id],
    });

    await usePageStore.getState().deletePage(page.id);

    expect(usePageStore.getState().pagesById[page.id]).toBeUndefined();
    expect(usePageStore.getState().recentPageIds).not.toContain(page.id);
  });

  it("clears currentPageId if the current page was the one deleted", async () => {
    const page = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    usePageStore.setState({ pagesById: { [page.id]: page }, currentPageId: page.id });

    await usePageStore.getState().deletePage(page.id);

    expect(usePageStore.getState().currentPageId).toBeNull();
  });
});

describe("recordVisit", () => {
  it("puts the most recent visit first and de-duplicates", () => {
    usePageStore.getState().recordVisit("a");
    usePageStore.getState().recordVisit("b");
    usePageStore.getState().recordVisit("a");
    expect(usePageStore.getState().recentPageIds).toEqual(["a", "b"]);
  });

  it("caps the list at 8 entries", () => {
    for (let i = 0; i < 10; i++) usePageStore.getState().recordVisit(`page-${i}`);
    expect(usePageStore.getState().recentPageIds).toHaveLength(8);
  });
});

function makeMinimalPage() {
  return {
    id: "p1",
    workspaceId: WS,
    parentId: null,
    title: "Untitled",
    isFavorite: false,
    order: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}
