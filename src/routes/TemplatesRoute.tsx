import { useEffect, useState } from "react";
import { FileStack, RotateCcw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";

import * as backupApi from "@/api/backup";
import * as templatesApi from "@/api/templates";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { TemplatePreview } from "@/features/templates/components/TemplatePreview";
import { usePageStore } from "@/stores/usePageStore";
import type { Template } from "@/types/entities";

const WORKSPACE_ID = "default";

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
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          aria-hidden="true"
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-muted aspect-4/5 animate-pulse rounded-lg" />
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
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-xl font-semibold">Templates</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Browse and pick one to start a new page pre-filled with it.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {templates.map((template) => (
          <div key={template.id} className="group relative">
            <button
              type="button"
              onClick={() => handleUse(template.id)}
              className="focus-visible:ring-ring block w-full rounded-lg text-left focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="border-border bg-card relative aspect-4/5 overflow-hidden rounded-lg border">
                <TemplatePreview template={template} />
                <div className="bg-foreground/0 group-hover:bg-foreground/5 absolute inset-0 flex items-center justify-center transition-colors">
                  <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    Use template
                  </span>
                </div>
              </div>
              <p className="mt-2 truncate text-sm font-medium">{template.name}</p>
              <p className="text-text-faint text-xs">
                {template.blocks.length} block{template.blocks.length === 1 ? "" : "s"}
              </p>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(template.id);
              }}
              aria-label={`Delete template ${template.name}`}
              className="bg-background/90 text-muted-foreground hover:text-destructive absolute top-2 right-2 flex size-7 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
