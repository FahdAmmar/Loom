import { vi } from "vitest";

import "@testing-library/jest-dom/vitest";

// The mock API layer simulates real network latency (networkDelay) so the
// app's loading states get exercised honestly during manual use. Tests care
// about behavior, not about waiting out that latency — mock just this one
// export, keep everything else in the module real.
vi.mock("@/api/_mockDb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/_mockDb")>();
  return { ...actual, networkDelay: () => Promise.resolve() };
});
