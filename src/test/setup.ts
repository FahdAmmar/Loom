import { beforeEach, vi } from "vitest";

import "@testing-library/jest-dom/vitest";
// jsdom doesn't implement IndexedDB — polyfill it so the mock DB's real
// persistence path (not just its in-memory cache) actually runs in tests.
import "fake-indexeddb/auto";

import { mockDb } from "@/api/_mockDb";

// The mock API layer simulates real network latency (networkDelay) so the
// app's loading states get exercised honestly during manual use. Tests care
// about behavior, not about waiting out that latency — mock just this one
// export, keep everything else in the module real.
vi.mock("@/api/_mockDb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/_mockDb")>();
  return { ...actual, networkDelay: () => Promise.resolve() };
});

// Every test starts from a fresh, isolated in-memory database — mirrors
// what clearing localStorage did before the IndexedDB migration.
beforeEach(() => {
  mockDb.resetForTests();
});
