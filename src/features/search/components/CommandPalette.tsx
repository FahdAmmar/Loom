import { useEffect, useRef, useState } from "react";
import {
  Compass,
  FilePlus,
  FileText,
  Maximize2,
  Keyboard,
  Moon,
  Network,
  PanelLeft,
  Search,
  Settings,
  Sun,
  Tag,
} from "lucide-react";
import { useNavigate } from "react-router";

import * as searchApi from "@/api/search";
import type { SearchResult } from "@/api/search";
import { Dialog } from "@/components/ui/dialog";
import { useTheme } from "@/hooks/useTheme";
import { useSearchStore } from "@/stores/useSearchStore";
import { describeFilters } from "@/features/search/describeFilters";
import { searchWithFilters } from "@/features/search/searchWithFilters";
import { useT } from "@/i18n/useT";
import { hasFilters, parseSearchQuery } from "@/lib/searchQuery";
import { useFocusModeStore } from "@/stores/useFocusModeStore";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { useShortcutsDialogStore } from "@/stores/useShortcutsDialogStore";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { usePageStore } from "@/stores/usePageStore";

const WORKSPACE_ID = "default";

type PaletteItem =
  | { kind: "action"; id: string; label: string; icon: typeof Search; run: () => void }
  | {
      kind: "page";
      id: string;
      label: string;
      snippet?: string;
      tagName?: string;
      pageId: string;
    }
  | { kind: "create"; id: string; label: string };

export function CommandPalette() {
  const isOpen = useSearchStore((s) => s.isCommandPaletteOpen);
  const close = useSearchStore((s) => s.closeCommandPalette);
  const t = useT();
  const navigate = useNavigate();
  const createPage = usePageStore((s) => s.createPage);
  const pagesById = usePageStore((s) => s.pagesById);
  const recentPageIds = usePageStore((s) => s.recentPageIds);
  const toggleSidebarCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const toggleFocusMode = useFocusModeStore((s) => s.toggle);
  const openTour = useOnboardingStore((s) => s.open);
  const openShortcuts = useShortcutsDialogStore((s) => s.open);
  const { resolvedTheme, setTheme } = useTheme();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [pageResults, setPageResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const parsed = parseSearchQuery(query);
    if (!parsed.text && !hasFilters(parsed)) {
      setPageResults([]);
      return;
    }
    let cancelled = false;
    searchWithFilters(parsed, {
      search: searchApi.search,
      pagesById: usePageStore.getState().pagesById,
    }).then((results) => {
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

  const staticActions: PaletteItem[] = [
    {
      kind: "action",
      id: "new-page",
      label: t("palette.newPage"),
      icon: FilePlus,
      run: handleNewPage,
    },
    {
      kind: "action",
      id: "open-graph",
      label: t("palette.openGraph"),
      icon: Network,
      run: () => {
        close();
        navigate(`/w/${WORKSPACE_ID}/graph`, { viewTransition: true });
      },
    },
    {
      kind: "action",
      id: "open-settings",
      label: t("palette.openSettings"),
      icon: Settings,
      run: () => {
        close();
        navigate("/settings");
      },
    },
    {
      kind: "action",
      id: "keyboard-shortcuts",
      label: t("palette.shortcuts"),
      icon: Keyboard,
      run: () => {
        close();
        openShortcuts();
      },
    },
    {
      kind: "action",
      id: "toggle-sidebar",
      label: t("palette.toggleSidebar"),
      icon: PanelLeft,
      run: () => {
        close();
        toggleSidebarCollapsed();
      },
    },
    {
      kind: "action",
      id: "take-tour",
      label: t("tour.replay"),
      icon: Compass,
      run: () => {
        close();
        openTour();
      },
    },
    {
      kind: "action",
      id: "toggle-focus-mode",
      label: t("palette.toggleFocus"),
      icon: Maximize2,
      run: () => {
        close();
        toggleFocusMode();
      },
    },
    {
      kind: "action",
      id: "toggle-theme",
      label: resolvedTheme === "dark" ? t("palette.toLight") : t("palette.toDark"),
      icon: resolvedTheme === "dark" ? Sun : Moon,
      run: () => {
        close();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      },
    },
  ];

  const parsedQuery = parseSearchQuery(query);
  const trimmedQuery = parsedQuery.text;
  const isFiltering = hasFilters(parsedQuery);
  const isSearching = trimmedQuery !== "" || isFiltering;
  const filteredActions = isFiltering
    ? []
    : trimmedQuery
      ? staticActions.filter((a) =>
          a.kind === "action"
            ? a.label.toLowerCase().includes(trimmedQuery.toLowerCase())
            : true,
        )
      : staticActions;

  const pageItems: PaletteItem[] = isSearching
    ? pageResults.map((result) => ({
        kind: "page",
        id: `page-${result.page.id}`,
        label: result.page.title,
        snippet: result.snippet,
        tagName: result.tagName,
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
      ? [
          {
            kind: "create",
            id: "create-named",
            label: t("palette.createNamed", { title: trimmedQuery }),
          },
        ]
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
      aria-label={t("palette.label")}
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
          placeholder={t("palette.placeholder")}
          aria-label={t("palette.inputLabel")}
          dir="auto"
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

      {isFiltering && (
        <ul
          aria-label={t("palette.filters")}
          className="border-border flex flex-wrap gap-1.5 border-b px-4 py-2"
        >
          {describeFilters(parsedQuery).map((filter) => (
            <li
              key={filter.key}
              className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-xs"
            >
              {t(filter.label, filter.params)}
            </li>
          ))}
        </ul>
      )}

      <div
        id="palette-listbox"
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="listbox"
        aria-label={t("palette.results")}
        className="max-h-80 overflow-y-auto p-1.5"
      >
        {items.length === 0 ? (
          <p className="text-muted-foreground px-2.5 py-3 text-sm">{t("palette.noResults")}</p>
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
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-start text-sm " +
                (index === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground")
              }
            >
              {item.kind === "action" ? (
                <item.icon className="size-4 shrink-0" />
              ) : item.kind === "page" ? (
                item.tagName ? (
                  <Tag className="size-4 shrink-0" />
                ) : (
                  <FileText className="size-4 shrink-0" />
                )
              ) : (
                <FilePlus className="size-4 shrink-0" />
              )}
              <span className="min-w-0 flex-1">
                <span className="text-foreground block truncate">{item.label}</span>
                {item.kind === "page" && item.snippet && (
                  <span className="text-text-faint block truncate text-xs">{item.snippet}</span>
                )}
                {item.kind === "page" && item.tagName && (
                  <span className="text-text-faint block truncate text-xs">
                    {t("palette.taggedWith", { tag: item.tagName })}
                  </span>
                )}
              </span>
            </button>
          ))
        )}
      </div>

      {!isSearching && (
        <p className="text-text-faint border-border border-t px-4 py-2 text-xs">
          {t("palette.hint")}
        </p>
      )}
    </Dialog>
  );
}
