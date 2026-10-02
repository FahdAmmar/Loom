import { describe, expect, it, vi } from "vitest";

import { createCommandHistory, type Command } from "./commandHistory";

function makeCommand(log: string[], name: string, extra: Partial<Command> = {}): Command {
  return {
    label: name,
    undo: async () => {
      log.push(`undo ${name}`);
    },
    redo: async () => {
      log.push(`redo ${name}`);
    },
    ...extra,
  };
}

describe("createCommandHistory", () => {
  it("undoes and redoes the most recent step first", async () => {
    const log: string[] = [];
    const history = createCommandHistory();
    history.record(makeCommand(log, "a"));
    history.record(makeCommand(log, "b"));

    expect((await history.undo())?.label).toBe("b");
    expect((await history.undo())?.label).toBe("a");
    expect((await history.redo())?.label).toBe("a");
    expect(log).toEqual(["undo b", "undo a", "redo a"]);
  });

  it("resolves null when there is nothing to undo or redo", async () => {
    const history = createCommandHistory();
    expect(await history.undo()).toBeNull();
    expect(await history.redo()).toBeNull();
  });

  it("drops the redo stack when a new step is recorded", async () => {
    const log: string[] = [];
    const history = createCommandHistory();
    history.record(makeCommand(log, "a"));
    await history.undo();
    history.record(makeCommand(log, "b"));
    expect(await history.redo()).toBeNull();
  });

  it("keeps only the newest steps once the limit is reached", async () => {
    const history = createCommandHistory(2);
    const log: string[] = [];
    for (const name of ["a", "b", "c"]) history.record(makeCommand(log, name));
    await history.undo();
    await history.undo();
    expect(await history.undo()).toBeNull();
    expect(log).toEqual(["undo c", "undo b"]);
  });

  it("does not record steps made while replaying", async () => {
    const history = createCommandHistory();
    const log: string[] = [];
    history.record({
      label: "outer",
      undo: async () => history.record(makeCommand(log, "inner")),
      redo: async () => {},
    });
    await history.undo();
    expect(history.getState()).toEqual({ undoLabel: null, redoLabel: "outer" });
  });

  it("merges a group into one step that undoes in reverse and redoes in order", async () => {
    const log: string[] = [];
    const history = createCommandHistory();
    await history.group("Paste", async () => {
      history.record(makeCommand(log, "1"));
      history.record(makeCommand(log, "2"));
      history.record(makeCommand(log, "3"));
    });

    expect(history.getState().undoLabel).toBe("Paste");
    await history.undo();
    await history.redo();
    expect(log).toEqual(["undo 3", "undo 2", "undo 1", "redo 1", "redo 2", "redo 3"]);
    expect(await history.undo()).not.toBeNull();
    expect(await history.undo()).toBeNull();
  });

  it("records nothing for an empty group and merges nested groups into the outer one", async () => {
    const log: string[] = [];
    const history = createCommandHistory();
    await history.group("empty", async () => {});
    expect(history.getState().undoLabel).toBeNull();

    await history.group("outer", async () => {
      await history.group("inner", async () => history.record(makeCommand(log, "x")));
      history.record(makeCommand(log, "y"));
    });
    await history.undo();
    expect(log).toEqual(["undo y", "undo x"]);
  });

  it("still ends the group when its work throws", async () => {
    const log: string[] = [];
    const history = createCommandHistory();
    await expect(
      history.group("Paste", async () => {
        history.record(makeCommand(log, "half"));
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(history.getState().undoLabel).toBe("Paste");
  });

  it("keeps a step available when its undo fails", async () => {
    const history = createCommandHistory();
    history.record({
      label: "flaky",
      undo: async () => {
        throw new Error("offline");
      },
      redo: async () => {},
    });
    await expect(history.undo()).rejects.toThrow("offline");
    expect(history.getState().undoLabel).toBe("flaky");
    expect(history.getState().redoLabel).toBeNull();
  });

  it("runs quick consecutive undos one after another", async () => {
    const order: string[] = [];
    const history = createCommandHistory();
    for (const name of ["a", "b"]) {
      history.record({
        label: name,
        undo: async () => {
          order.push(`start ${name}`);
          await new Promise((resolve) => setTimeout(resolve, 5));
          order.push(`end ${name}`);
        },
        redo: async () => {},
      });
    }
    await Promise.all([history.undo(), history.undo()]);
    expect(order).toEqual(["start b", "end b", "start a", "end a"]);
  });

  it("removes steps by key from both stacks", async () => {
    const log: string[] = [];
    const key = {};
    const history = createCommandHistory();
    history.record(makeCommand(log, "keep"));
    history.record(makeCommand(log, "drop", { key }));
    history.remove(key);
    expect(history.getState().undoLabel).toBe("keep");
  });

  it("notifies subscribers on change and stops after unsubscribe", async () => {
    const listener = vi.fn();
    const history = createCommandHistory();
    const unsubscribe = history.subscribe(listener);
    history.record(makeCommand([], "a"));
    await history.undo();
    history.clear();
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    history.record(makeCommand([], "b"));
    expect(listener).toHaveBeenCalledTimes(3);
  });
});
