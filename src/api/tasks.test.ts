import { beforeEach, describe, expect, it } from "vitest";

import { initDb } from "@/api/_mockDb";
import { listTasks, setTaskChecked } from "@/api/tasks";

beforeEach(async () => {
  await initDb();
});

describe("tasks api", () => {
  it("lists the demo checklist items", async () => {
    const tasks = await listTasks("default");
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.some((t) => t.text === "This one's still open")).toBe(true);
  });

  it("toggles a task and keeps the rest of its content", async () => {
    const before = (await listTasks("default")).find(
      (t) => t.text === "This one's still open",
    )!;
    expect(before.checked).toBe(false);
    await setTaskChecked(before.blockId, true);
    const after = (await listTasks("default")).find((t) => t.blockId === before.blockId)!;
    expect(after.checked).toBe(true);
    expect(after.text).toBe(before.text);
  });

  it("rejects an unknown block", async () => {
    await expect(setTaskChecked("missing", true)).rejects.toThrow(/No checklist item/);
  });
});
