import { beforeEach, describe, expect, it } from "vitest";

import { initDb, mockDb } from "@/api/_mockDb";
import { idbDelete, idbGet, idbSet } from "@/api/idbStorage";
import type { Page } from "@/types/entities";

// Mirrors the private storage keys in _mockDb.ts — duplicated here rather
// than exported, since they're an internal persistence detail, not part of
// the module's public API.
const IDB_KEY = "loom-db-v1";
const LEGACY_LOCALSTORAGE_KEY = "loom-mock-db-v5";

function minimalDb(page: Page) {
  return {
    workspaces: {},
    pages: { [page.id]: page },
    blocks: {},
    links: {},
    tags: {},
    pageTags: {},
    pageProperties: {},
    templates: {},
  };
}

beforeEach(async () => {
  localStorage.clear();
  await idbDelete(IDB_KEY);
});

describe("initDb", () => {
  it("seeds and persists demo content when nothing exists anywhere", async () => {
    await initDb();

    const db = mockDb.read();
    expect(Object.keys(db.pages).length).toBeGreaterThan(0);

    const stored = await idbGet<{ pages: Record<string, unknown> }>(IDB_KEY);
    expect(stored?.pages).toBeDefined();
  });

  it("migrates a pre-existing localStorage database into IndexedDB, then removes it", async () => {
    const legacyPage: Page = {
      id: "page-legacy",
      workspaceId: "default",
      parentId: null,
      title: "From before the migration",
      isFavorite: false,
      order: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    localStorage.setItem(LEGACY_LOCALSTORAGE_KEY, JSON.stringify(minimalDb(legacyPage)));

    await initDb();

    expect(mockDb.read().pages["page-legacy"]).toBeDefined();
    expect(localStorage.getItem(LEGACY_LOCALSTORAGE_KEY)).toBeNull();

    const stored = await idbGet<{ pages: Record<string, unknown> }>(IDB_KEY);
    expect(stored?.pages["page-legacy"]).toBeDefined();
  });

  it("prefers data already in IndexedDB over reseeding", async () => {
    const persistedPage: Page = {
      id: "page-persisted",
      workspaceId: "default",
      parentId: null,
      title: "Already saved",
      isFavorite: false,
      order: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    await idbSet(IDB_KEY, minimalDb(persistedPage));

    await initDb();

    expect(mockDb.read().pages["page-persisted"]).toBeDefined();
    expect(mockDb.read().pages["page-welcome"]).toBeUndefined();
  });
});
