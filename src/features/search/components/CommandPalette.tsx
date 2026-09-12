import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  CalendarDays,
  FilePlus,
  FileText,
  FileUp,
  Moon,
  Network,
  PanelLeft,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { useNavigate } from "react-router";

import * as blocksApi from "@/api/blocks";
import * as dailyNotesApi from "@/api/dailyNotes";
import * as linksApi from "@/api/links";
import * as searchApi from "@/api/search";
import type { SearchResult } from "@/api/search";
import { Dialog } from "@/components/ui/dialog";
import {
  extractTitleFromMarkdown,
  extractWikilinkTitles,
  markdownToBlocks,
} from "@/features/markdown/importMarkdown";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import { extractPageLinkIdsFromHtml } from "@/lib/blocks";
import { useSearchStore } from "@/stores/useSearchStore";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { usePageStore } from "@/stores/usePageStore";

const WORKSPACE_ID = "default";

type PaletteItem =
  | { kind: "action"; id: string; label: string; icon: typeof Search; run: () => void }
  | { kind: "page"; id: string; label: string; snippet?: string; pageId: string }
  | { kind: "create"; id: string; label: string };

export function CommandPalette() {
  const isOpen = useSearchStore((s) => s.isCommandPaletteOpen);
  const close = useSearchStore((s) => s.closeCommandPalette);
  const navigate = useNavigate();
  const createPage = usePageStore((s) => s.createPage);
  const addPage = usePageStore((s) => s.addPage);
  const pagesById = usePageStore((s) => s.pagesById);
  const recentPageIds = usePageStore((s) => s.recentPageIds);
  const toggleSidebarCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const { resolvedTheme, setTheme } = useTheme();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [pageResults, setPageResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Reset to a clean slate every time the palette opens, and focus the input
  // once the native <dialog> has finished opening.
  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setPageResults([]);
    setActiveIndex(0);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setPageResults([]);
      return;
    }
    let cancelled = false;
    searchApi.search(query).then((results) => {
      if (!cancelled) setPageResults(results);
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  async function handleNewPage() {
    close();
    const page = await createPage(WORKSPACE_ID, null);
    navigate(`/w/${WORKSPACE_ID}/p/${page.id}`, { viewTransition: true });
  }

  async function handleTodayNote() {
    close();
    // getOrCreateTodayNote persists straight to the mock DB, bypassing
    // usePageStore.createPage — sync it in manually, same as the "use
    // template" flow does.
    const page = await dailyNotesApi.getOrCreateTodayNote(WORKSPACE_ID);
    addPage(page);
    navigate(`/w/${WORKSPACE_ID}/p/${page.id}`, { viewTransition: true });
  }

  function handleImportMarkdown() {
    close();
    importFileInputRef.current?.click();
  }

  async function handleMarkdownFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be re-picked after a failed import
    if (!file) return;

    try {
      const text = await file.text();
      const title =
        extractTitleFromMarkdown(text) ?? file.name.replace(/\.(md|markdown)$/i, "");

      // Resolve every [[Title]] mention to a real page — creating any
      // that don't already exist — *before* converting content, so
      // markdownToBlocks itself is just a synchronous lookup.
      const titleToPageId = new Map<string, string>();
      for (const page of Object.values(pagesById)) {
        titleToPageId.set(page.title.toLowerCase(), page.id);
      }
      for (const wikilinkTitle of extractWikilinkTitles(text)) {
        const key = wikilinkTitle.toLowerCase();
        if (titleToPageId.has(key)) continue;
        // Sequential on purpose: createPage reads the current sibling
        // count to assign each new page's order — running these in
        // parallel would have every call read the same "before" count
        // and race on it, unlike the independent syncBlockLinks calls below.
        // oxlint-disable-next-line no-await-in-loop
        const created = await createPage(WORKSPACE_ID, null, wikilinkTitle);
        titleToPageId.set(key, created.id);
      }

      const drafts = markdownToBlocks(text, (t) => titleToPageId.get(t.toLowerCase()) ?? null);
      const page = await createPage(WORKSPACE_ID, null, title);
      const blocks = await blocksApi.createBlocks(page.id, drafts);

      // Sync [[links]] for every imported block that has one, so
      // backlinks work immediately rather than only after the next edit.
      await Promise.all(
        blocks.map((block) => {
          const html = block.content.html;
          if (typeof html !== "string") return Promise.resolve();
          return linksApi.syncBlockLinks(page.id, block.id, extractPageLinkIdsFromHtml(html));
        }),
      );

      navigate(`/w/${WORKSPACE_ID}/p/${page.id}`, { viewTransition: true });
      toast(
        `Imported "${title}" (${blocks.length} block${blocks.length === 1 ? "" : "s"}).`,
        "success",
      );
    } catch {
      toast("Couldn't import that file.", "error");
    }
  }

  const staticActions: PaletteItem[] = [
    {
      kind: "action",
      id: "new-page",
      label: "Create new page",
      icon: FilePlus,
      run: handleNewPage,
    },
    {
      kind: "action",
      id: "today-note",
      label: "Open today's note",
      icon: CalendarDays,
      run: handleTodayNote,
    },
    {
      kind: "action",
      id: "import-markdown",
      label: "Import Markdown file…",
      icon: FileUp,
      run: handleImportMarkdown,
    },
    {
      kind: "action",
      id: "open-graph",
      label: "Open Graph View",
      icon: Network,
      run: () => {
        close();
        navigate(`/w/${WORKSPACE_ID}/graph`, { viewTransition: true });
      },
    },
    {
      kind: "action",
      id: "open-settings",
      label: "Open Settings",
      icon: Settings,
      run: () => {
        close();
        navigate("/settings");
      },
    },
    {
      kind: "action",
      id: "toggle-sidebar",
      label: "Toggle sidebar",
      icon: PanelLeft,
      run: () => {
        close();
        toggleSidebarCollapsed();
      },
    },
    {
      kind: "action",
      id: "toggle-theme",
      label: resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      icon: resolvedTheme === "dark" ? Sun : Moon,
      run: () => {
        close();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      },
    },
  ];

  const trimmedQuery = query.trim();
  const filteredActions = trimmedQuery
    ? staticActions.filter((a) =>
        a.kind === "action" ? a.label.toLowerCase().includes(trimmedQuery.toLowerCase()) : true,
      )
    : staticActions;

  const pageItems: PaletteItem[] = trimmedQuery
    ? pageResults.map((result) => ({
        kind: "page",
        id: `page-${result.page.id}`,
        label: result.page.title,
        snippet: result.snippet,
        pageId: result.page.id,
      }))
    : recentPageIds
        .map((id) => pagesById[id])
        .filter((p) => Boolean(p))
        .map((page) => ({
          kind: "page" as const,
          id: `recent-${page.id}`,
          label: page.title,
          snippet: undefined,
          pageId: page.id,
        }));

  const hasExactTitleMatch = pageResults.some(
    (r) => r.page.title.toLowerCase() === trimmedQuery.toLowerCase(),
  );
  const createItem: PaletteItem[] =
    trimmedQuery && !hasExactTitleMatch
      ? [{ kind: "create", id: "create-named", label: `Create page "${trimmedQuery}"` }]
      : [];

  const items: PaletteItem[] = [...filteredActions, ...pageItems, ...createItem];

  async function runItem(item: PaletteItem) {
    if (item.kind === "action") {
      item.run();
    } else if (item.kind === "page") {
      close();
      navigate(`/w/${WORKSPACE_ID}/p/${item.pageId}`, { viewTransition: true });
    } else {
      close();
      const page = await createPage(WORKSPACE_ID, null, trimmedQuery);
      navigate(`/w/${WORKSPACE_ID}/p/${page.id}`, { viewTransition: true });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) runItem(item);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={close}
      aria-label="Command palette"
      className="mt-[14vh] w-[min(36rem,calc(100vw-2rem))] overflow-hidden p-0"
    >
      <div className="border-border flex items-center gap-2.5 border-b px-4 py-3">
        <Search className="text-text-faint size-4 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search pages, or run a command…"
          aria-label="Command palette input"
          aria-activedescendant={
            items[activeIndex] ? `palette-item-${items[activeIndex].id}` : undefined
          }
          // Standard ARIA combobox-with-listbox-popup pattern: a plain
          // <select> can't mix icon rows, action commands, and live search
          // results, or stay open while filtering as you type.
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-listbox"
          autoComplete="off"
          className="text-foreground placeholder:text-text-faint min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        <kbd className="border-border text-text-faint rounded border px-1.5 py-0.5 font-mono text-[10px]">
          esc
        </kbd>
      </div>

      <div
        id="palette-listbox"
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="listbox"
        aria-label="Results"
        className="max-h-80 overflow-y-auto p-1.5"
      >
        {items.length === 0 ? (
          <p className="text-muted-foreground px-2.5 py-3 text-sm">No results.</p>
        ) : (
          items.map((item, index) => (
            <button
              key={item.id}
              id={`palette-item-${item.id}`}
              type="button"
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                runItem(item);
              }}
              className={
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm " +
                (index === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground")
              }
            >
              {item.kind === "action" ? (
                <item.icon className="size-4 shrink-0" />
              ) : item.kind === "page" ? (
                <FileText className="size-4 shrink-0" />
              ) : (
                <FilePlus className="size-4 shrink-0" />
              )}
              <span className="min-w-0 flex-1">
                <span className="text-foreground block truncate">{item.label}</span>
                {item.kind === "page" && item.snippet && (
                  <span className="text-text-faint block truncate text-xs">{item.snippet}</span>
                )}
              </span>
            </button>
          ))
        )}
      </div>

      <input
        ref={importFileInputRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        className="hidden"
        onChange={handleMarkdownFileSelected}
      />
    </Dialog>
  );
}
