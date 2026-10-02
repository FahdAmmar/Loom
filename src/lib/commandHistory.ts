/** One reversible step. `undo`/`redo` talk to the store or API and must be safe to call in order. */
export interface Command<Label extends string = string> {
  label: Label;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  /** Lets an outside action that reverses this step by itself retire it (see `remove`). */
  key?: unknown;
}

export interface HistoryState<Label extends string = string> {
  undoLabel: Label | null;
  redoLabel: Label | null;
}

export interface CommandHistory<Label extends string = string> {
  /** Ignored while an undo/redo is running, so replaying never records itself. */
  record: (command: Command<Label>) => void;
  /** Steps recorded inside `fn` become one undo step; nested groups merge into the outer one. */
  group: <T>(label: Label, fn: () => Promise<T>) => Promise<T>;
  /** Resolves with the command that was reversed, or null when there was nothing to do. */
  undo: () => Promise<Command<Label> | null>;
  redo: () => Promise<Command<Label> | null>;
  remove: (key: unknown) => void;
  clear: () => void;
  getState: () => HistoryState<Label>;
  subscribe: (listener: () => void) => () => void;
}

export function createCommandHistory<Label extends string = string>(
  limit = 100,
): CommandHistory<Label> {
  let undoStack: Command<Label>[] = [];
  let redoStack: Command<Label>[] = [];
  let openGroup: Command<Label>[] | null = null;
  let isReplaying = false;
  // Rapid key presses queue up instead of interleaving their async work.
  let queue: Promise<unknown> = Promise.resolve();
  const listeners = new Set<() => void>();

  function notify() {
    for (const listener of listeners) listener();
  }

  function pushUndo(command: Command<Label>) {
    undoStack.push(command);
    if (undoStack.length > limit) undoStack.shift();
  }

  function record(command: Command<Label>) {
    if (isReplaying) return;
    if (openGroup) {
      openGroup.push(command);
      return;
    }
    pushUndo(command);
    redoStack = [];
    notify();
  }

  function merge(label: Label, commands: Command<Label>[]): Command<Label> {
    if (commands.length === 1) return { ...commands[0], label };
    return {
      label,
      undo: async () => {
        for (const command of [...commands].reverse()) await command.undo(); // oxlint-disable-line no-await-in-loop
      },
      redo: async () => {
        for (const command of commands) await command.redo(); // oxlint-disable-line no-await-in-loop
      },
    };
  }

  async function group<T>(label: Label, fn: () => Promise<T>): Promise<T> {
    if (openGroup || isReplaying) return fn();
    const collected: Command<Label>[] = [];
    openGroup = collected;
    try {
      return await fn();
    } finally {
      openGroup = null;
      if (collected.length > 0) record(merge(label, collected));
    }
  }

  function run(direction: "undo" | "redo"): Promise<Command<Label> | null> {
    const task = queue.then(async () => {
      const source = direction === "undo" ? undoStack : redoStack;
      const command = source.pop();
      if (!command) return null;

      isReplaying = true;
      try {
        await (direction === "undo" ? command.undo() : command.redo());
      } catch (error) {
        source.push(command); // still applied as before — keep it available
        throw error;
      } finally {
        isReplaying = false;
      }

      if (direction === "undo") redoStack.push(command);
      else pushUndo(command);
      notify();
      return command;
    });
    queue = task.catch(() => undefined);
    return task;
  }

  return {
    record,
    group,
    undo: () => run("undo"),
    redo: () => run("redo"),
    remove: (key) => {
      undoStack = undoStack.filter((command) => command.key !== key);
      redoStack = redoStack.filter((command) => command.key !== key);
      notify();
    },
    clear: () => {
      undoStack = [];
      redoStack = [];
      notify();
    },
    getState: () => ({
      undoLabel: undoStack.at(-1)?.label ?? null,
      redoLabel: redoStack.at(-1)?.label ?? null,
    }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
