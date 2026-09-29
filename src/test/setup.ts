import { beforeEach, vi } from "vitest";

import "@testing-library/jest-dom/vitest";
// jsdom doesn't implement IndexedDB — polyfill it so the mock DB's real
// persistence path (not just its in-memory cache) actually runs in tests.
import "fake-indexeddb/auto";

import { mockDb } from "@/api/_mockDb";

/**
 * Node ships its own experimental `localStorage` global, and because it
 * already exists when the jsdom environment boots, jsdom never installs its
 * own — leaving `localStorage` permanently `undefined` here (Node logs
 * "localStorage is not available because --localstorage-file was not
 * provided"). The mock DB still needs it: `initDb()` reads the legacy
 * pre-IndexedDB key through `localStorage` to migrate old users forward.
 * So provide a minimal in-memory Storage, only when nothing else supplied one.
 */
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  const shim: Storage = {
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: shim,
    configurable: true,
    writable: true,
  });
}

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
