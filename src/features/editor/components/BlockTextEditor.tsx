import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { WikilinkMenu } from "@/features/editor/components/WikilinkMenu";
import { PageLinkNode } from "@/features/editor/nodes/pageLinkNode";
import { useEditorFocus } from "@/features/editor/useEditorFocus";
import { cn } from "@/lib/utils";
import { usePageStore } from "@/stores/usePageStore";
import type { BlockType, Page } from "@/types/entities";

export interface SlashState {
  open: boolean;
  query: string;
  coords?: { x: number; y: number };
}

interface WikilinkState {
  open: boolean;
  query: string;
  coords?: { x: number; y: number };
  range?: { from: number; to: number };
}

interface BlockTextEditorProps {
  blockId: string;
  html: string;
  placeholder?: string;
  className?: string;
  /** Only heading1/2/3 map to anything — everything else renders with no
   * heading role, same as a plain paragraph. */
  blockType?: BlockType;
  onChange: (html: string) => void;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
  onArrowUp: () => void;
  onArrowDown: () => void;
  onSlashStateChange: (state: SlashState) => void;
  /** While the slash menu is open, arrow/enter/escape go here first. Return true to swallow the key. */
  onSlashKeyDown: (key: string) => boolean;
}

const WORKSPACE_ID = "default";

// Headings here are Tiptap "paragraph" nodes wearing Tailwind classes, not
// real <h1>-<h6> elements — Heading is disabled in StarterKit.configure
// below because each block is its own independent Tiptap document with no
// concept of "this document's h1 vs h2," and the app's own BlockType
// already carries that meaning. Without something conveying heading
// semantics, a screen reader has no way to navigate this page by heading
// at all. `role="heading"` + `aria-level` gets that back without needing
// to restructure how blocks render.
const HEADING_LEVELS: Partial<Record<BlockType, number>> = {
  heading1: 1,
  heading2: 2,
  heading3: 3,
};

export function BlockTextEditor({
  blockId,
  html,
  placeholder,
  className,
  blockType,
  onChange,
  onEnter,
  onBackspaceEmpty,
  onArrowUp,
  onArrowDown,
  onSlashStateChange,
  onSlashKeyDown,
}: BlockTextEditorProps) {
  const { register } = useEditorFocus();
  const navigate = useNavigate();
  const pagesById = usePageStore((s) => s.pagesById);
  const [isEmpty, setIsEmpty] = useState(html.trim() === "");
  const [wikilinkState, setWikilinkState] = useState<WikilinkState>({ open: false, query: "" });
  const [wikilinkActiveIndex, setWikilinkActiveIndex] = useState(0);
  const isSlashOpenRef = useRef(false);
  const isWikilinkOpenRef = useRef(false);

  const matchingPages = wikilinkState.open
    ? Object.values(pagesById)
        .filter((p) => p.title.toLowerCase().includes(wikilinkState.query.trim().toLowerCase()))
        .slice(0, 8)
    : [];

  const headingLevel = blockType ? HEADING_LEVELS[blockType] : undefined;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Underline,
      PageLinkNode,
    ],
    content: html,
    editorProps: {
      attributes: {
        class: "outline-none",
        // aria-label only while empty — once there's real content, no
        // aria-label at all, so the accessible name comes from the actual
        // text (aria-label unconditionally set, as this was before, always
        // wins over text content: a screen reader would hear the
        // placeholder — "Heading 1" — forever, never the real heading text).
        ...(isEmpty ? { "aria-label": placeholder ?? "Block content" } : {}),
        ...(headingLevel ? { role: "heading", "aria-level": String(headingLevel) } : {}),
      },
      handleClickOn: (_view, _pos, node) => {
        if (node.type.name === "pageLink" && typeof node.attrs.pageId === "string") {
          navigate(`/w/${WORKSPACE_ID}/p/${node.attrs.pageId}`, { viewTransition: true });
          return true;
        }
        return false;
      },
      handleKeyDown: (view, event) => {
        if (isWikilinkOpenRef.current) {
          if (event.key === "ArrowDown") {
            setWikilinkActiveIndex((i) =>
              Math.min(i + 1, Math.max(matchingPages.length - 1, 0)),
            );
            return true;
          }
          if (event.key === "ArrowUp") {
            setWikilinkActiveIndex((i) => Math.max(i - 1, 0));
            return true;
          }
          if (event.key === "Enter") {
            const page = matchingPages[wikilinkActiveIndex];
            if (page) selectWikilink(page);
            return true;
          }
          if (event.key === "Escape") {
            closeWikilink();
            return true;
          }
        }

        if (isSlashOpenRef.current) {
          const handled = onSlashKeyDown(event.key);
          if (handled) return true;
        }

        if (event.key === "Enter" && !event.shiftKey) {
          onEnter();
          return true;
        }
        if (event.key === "Backspace" && view.state.doc.textContent === "") {
          onBackspaceEmpty();
          return true;
        }
        const atStart = view.state.selection.from <= 1;
        const atEnd = view.state.selection.from >= view.state.doc.content.size - 1;
        if (event.key === "ArrowUp" && atStart) {
          onArrowUp();
          return true;
        }
        if (event.key === "ArrowDown" && atEnd) {
          onArrowDown();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      const text = e.getText();
      setIsEmpty(text === "");
      onChange(e.getHTML());

      // Slash command — only meaningful at the very start of the block.
      if (text.startsWith("/")) {
        isSlashOpenRef.current = true;
        const coords = e.view.coordsAtPos(e.state.selection.from);
        onSlashStateChange({
          open: true,
          query: text.slice(1),
          coords: { x: coords.left, y: coords.bottom },
        });
      } else if (isSlashOpenRef.current) {
        isSlashOpenRef.current = false;
        onSlashStateChange({ open: false, query: "" });
      }

      // Wikilink — can trigger anywhere in the text, not just at the start.
      const { $from } = e.state.selection;
      const textBeforeCursor = $from.parent.textBetween(
        0,
        $from.parentOffset,
        undefined,
        "\ufffc",
      );
      const wikilinkMatch = /\[\[([^[\]]*)$/.exec(textBeforeCursor);
      if (wikilinkMatch) {
        isWikilinkOpenRef.current = true;
        setWikilinkActiveIndex(0);
        const coords = e.view.coordsAtPos(e.state.selection.from);
        const matchStart = $from.pos - wikilinkMatch[0].length;
        setWikilinkState({
          open: true,
          query: wikilinkMatch[1],
          coords: { x: coords.left, y: coords.bottom },
          range: { from: matchStart, to: $from.pos },
        });
      } else if (isWikilinkOpenRef.current) {
        closeWikilink();
      }
    },
  });

  function closeWikilink() {
    isWikilinkOpenRef.current = false;
    setWikilinkState({ open: false, query: "" });
  }

  function selectWikilink(page: Page) {
    const { range } = wikilinkState;
    closeWikilink();
    if (!editor || !range) return;
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertPageLink({ pageId: page.id, title: page.title })
      .run();
  }

  useEffect(() => {
    if (!editor) return;
    return register(blockId, () => editor.commands.focus("end"));
  }, [editor, blockId, register]);

  // Keeps role/aria-level/aria-label in sync with heading-level changes
  // (slash-command conversion) and with the empty/non-empty transition,
  // without recreating the whole editor instance — setOptions patches live
  // config; a full recreate would drop cursor position and undo history
  // for no reason.
  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: "outline-none",
          ...(isEmpty ? { "aria-label": placeholder ?? "Block content" } : {}),
          ...(headingLevel ? { role: "heading", "aria-level": String(headingLevel) } : {}),
        },
      },
    });
  }, [editor, headingLevel, placeholder, isEmpty]);

  return (
    <div className="relative min-w-0 flex-1">
      {isEmpty && placeholder && (
        <span className="text-text-faint pointer-events-none absolute inset-0 select-none">
          {placeholder}
        </span>
      )}
      <EditorContent editor={editor} className={cn("prose-block", className)} />
      {wikilinkState.open && wikilinkState.coords && (
        <WikilinkMenu
          pages={matchingPages}
          activeIndex={wikilinkActiveIndex}
          coords={wikilinkState.coords}
          onSelect={selectWikilink}
          onHoverIndex={setWikilinkActiveIndex}
        />
      )}
    </div>
  );
}
