import { extractPlainText } from "@/lib/blocks";
import type { Block, Page } from "@/types/entities";

export interface Task {
  blockId: string;
  pageId: string;
  pageTitle: string;
  text: string;
  checked: boolean;
}

export type TaskFilter = "open" | "done" | "all";

export interface TaskGroup {
  pageId: string;
  pageTitle: string;
  tasks: Task[];
}

/** Every non-empty checklist item on a live (not trashed) page, in page then block order. */
export function collectTasks(blocks: Block[], pagesById: Record<string, Page>): Task[] {
  const tasks: Task[] = [];
  for (const block of blocks) {
    if (block.type !== "checklist") continue;
    const page = pagesById[block.pageId];
    if (!page || page.deletedAt) continue;
    const text = extractPlainText(block);
    if (!text) continue;
    tasks.push({
      blockId: block.id,
      pageId: page.id,
      pageTitle: page.title,
      text,
      checked: block.content.checked === true,
    });
  }
  return tasks;
}

export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  if (filter === "open") return tasks.filter((t) => !t.checked);
  if (filter === "done") return tasks.filter((t) => t.checked);
  return tasks;
}

/** Groups by page, pages ordered by title and tasks keeping their original order. */
export function groupTasksByPage(tasks: Task[]): TaskGroup[] {
  const groups = new Map<string, TaskGroup>();
  for (const task of tasks) {
    const group = groups.get(task.pageId) ?? {
      pageId: task.pageId,
      pageTitle: task.pageTitle,
      tasks: [],
    };
    group.tasks.push(task);
    groups.set(task.pageId, group);
  }
  return [...groups.values()].sort((a, b) => a.pageTitle.localeCompare(b.pageTitle));
}
