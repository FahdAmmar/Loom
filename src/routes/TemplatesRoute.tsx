import { useEffect, useState } from "react";
import { FileStack, FileText, KanbanSquare, RotateCcw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";

import * as backupApi from "@/api/backup";
import * as templatesApi from "@/api/templates";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { usePageStore } from "@/stores/usePageStore";
import type { Template } from "@/types/entities";

const WORKSPACE_ID = "default";

/** A quick visual "what kind of template is this" cue, derived from its
 * blocks rather than a new field on Template — a board-based template
 * (todo/bug-tracker style) reads very differently at a glance from a plain
 * document one, and that difference is worth surfacing as the gallery
 * grows past a handful of entries. */
function templateIcon(template: Template) {
  return template.blocks.some((b) => b.type === "board") ? KanbanSquare : FileText;
}

export function TemplatesRoute() {
  const navigate = useNavigate();
  const addPage = usePageStore((s) => s.addPage);
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [isResetting, setResetting] = useState(false);

  useEffect(() => {
    templatesApi.listTemplates(WORKSPACE_ID).then(setTemplates);
  }, []);

  async function handleUse(templateId: string) {
    const page = await templatesApi.createPageFromTemplate(templateId, WORKSPACE_ID, null);
    // createPageFromTemplate persists straight to the mock DB, bypassing
    // usePageStore.createPage — sync it in manually so the sidebar tree and
    // PageRoute's lookup see it immediately instead of "page doesn't exist".
    addPage(page);
    navigate(`/w/${WORKSPACE_ID}/p/${page.id}`, { viewTransition: true });
  }

  async function handleDelete(templateId: string) {
    await templatesApi.deleteTemplate(templateId);
    setTemplates((prev) => prev?.filter((t) => t.id !== templateId) ?? null);
  }

  async function handleLoadStarterContent() {
    setResetting(true);
    await backupApi.resetWorkspaceToDemoContent();
    // A full reload guarantees every store (pages, tags, this template list)
    // reflects the freshly-loaded demo content, not just this route.
    window.location.assign(`/w/${WORKSPACE_ID}/templates`);
  }

  if (templates === null) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex flex-col gap-3" aria-hidden="true">
          {[0, 1].map((i) => (
            <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <EmptyState
        icon={<FileStack className="size-5" />}
        title="No templates yet"
        description={
          'Save any page as a template from its "···" menu and it shows up here — or load ' +
          "the eight built-in starter templates now."
        }
        action={
          <Button size="sm" className="mt-2" onClick={handleLoadStarterContent}>
            {isResetting ? (
              <RotateCcw className="size-3.5 animate-spin" />
            ) : (
              <RotateCcw className="size-3.5" />
            )}
            Load starter templates
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-semibold">Templates</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Start a new page pre-filled from one of these.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        {templates.map((template) => {
          const Icon = templateIcon(template);
          return (
            <div
              key={template.id}
              className="border-border flex items-center justify-between gap-3 rounded-lg border p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{template.name}</p>
                  <p className="text-text-faint text-xs">
                    {template.blocks.length} block{template.blocks.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="sm" onClick={() => handleUse(template.id)}>
                  Use template
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete template ${template.name}`}
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
