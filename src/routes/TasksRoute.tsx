import { CheckSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import * as tasksApi from "@/api/tasks";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import type { MessageKey } from "@/i18n";
import { useT } from "@/i18n/useT";
import { filterTasks, groupTasksByPage, type Task, type TaskFilter } from "@/lib/tasks";

const WORKSPACE_ID = "default";

const FILTERS: { value: TaskFilter; labelKey: MessageKey }[] = [
  { value: "open", labelKey: "tasks.open" },
  { value: "done", labelKey: "tasks.done" },
  { value: "all", labelKey: "tasks.all" },
];

export function TasksRoute() {
  const t = useT();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [filter, setFilter] = useState<TaskFilter>("open");

  useEffect(() => {
    tasksApi
      .listTasks(WORKSPACE_ID)
      .then(setTasks)
      .catch(() => toast(t("tasks.loadFailed"), "error"));
    // Load once on mount; `toast` and `t` are stable enough for a one-off fetch.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggle(task: Task) {
    const checked = !task.checked;
    const apply = (value: boolean) =>
      setTasks(
        (prev) =>
          prev?.map((item) =>
            item.blockId === task.blockId ? { ...item, checked: value } : item,
          ) ?? null,
      );
    apply(checked);
    try {
      await tasksApi.setTaskChecked(task.blockId, checked);
    } catch {
      apply(task.checked);
      toast(t("tasks.updateFailed"), "error");
    }
  }

  if (tasks === null) {
    return <p className="text-muted-foreground px-6 py-10 text-sm">{t("tasks.loading")}</p>;
  }

  const groups = groupTasksByPage(filterTasks(tasks, filter));
  const openCount = tasks.filter((task) => !task.checked).length;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-semibold">{t("tasks.title")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {t("tasks.summary", { open: openCount, total: tasks.length })}
      </p>

      <fieldset className="mt-5 flex min-w-0 gap-2 border-0 p-0" aria-label={t("tasks.filter")}>
        {FILTERS.map(({ value, labelKey }) => (
          <Button
            key={value}
            type="button"
            size="sm"
            aria-pressed={filter === value}
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {t(labelKey)}
          </Button>
        ))}
      </fieldset>

      {groups.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="size-5" />}
          title={t(filter === "done" ? "tasks.emptyDone" : "tasks.emptyOpen")}
          description={t("tasks.emptyHint")}
        />
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.pageId} aria-label={group.pageTitle}>
              <h2 className="text-sm font-medium">
                <Link
                  viewTransition
                  to={`/w/${WORKSPACE_ID}/p/${group.pageId}`}
                  className="hover:underline"
                >
                  {group.pageTitle || t("tasks.untitled")}
                </Link>
              </h2>
              <ul className="mt-2 flex flex-col gap-1">
                {group.tasks.map((task) => (
                  <li key={task.blockId}>
                    <label className="hover:bg-accent flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={task.checked}
                        onChange={() => handleToggle(task)}
                        className="accent-brand-mint mt-0.5 size-4"
                      />
                      <span
                        dir="auto"
                        className={task.checked ? "text-text-faint line-through" : undefined}
                      >
                        {task.text}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
