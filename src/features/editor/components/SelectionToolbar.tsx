import { useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Check,
  Code,
  Eraser,
  Highlighter,
  Italic,
  Link2,
  Strikethrough,
  Underline,
  Unlink,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { HIGHLIGHT_COLORS, type HighlightColor } from "@/features/editor/extensions/Highlight";
import { cn } from "@/lib/utils";
import { normalizeLinkUrl } from "@/lib/url";

interface SelectionToolbarProps {
  editor: Editor;
}

const BUTTON_CLASS =
  "text-muted-foreground hover:bg-accent hover:text-foreground flex size-7 items-center justify-center rounded";
const BUTTON_ACTIVE_CLASS = "bg-accent text-foreground";

/**
 * Floating formatting bar that appears over selected text. Each block owns
 * its own Tiptap instance, so this is mounted once per `BlockTextEditor`;
 * Tiptap's BubbleMenu only shows it for the instance that has a non-empty
 * selection and focus.
 */
export function SelectionToolbar({ editor }: SelectionToolbarProps) {
  const [isEditingLink, setEditingLink] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [isLinkInvalid, setLinkInvalid] = useState(false);
  const [isPickingHighlight, setPickingHighlight] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      link: e.isActive("link"),
      highlight: e.isActive("highlight"),
      highlightColor:
        (e.getAttributes("highlight").color as HighlightColor | undefined) ?? null,
    }),
  });

  // Memoized so BubbleMenu doesn't re-register its plugin on every render.
  const menuOptions = useMemo(
    () => ({
      strategy: "fixed" as const,
      placement: "top" as const,
      offset: 8,
      flip: true,
      shift: { padding: 8 },
      onHide: () => {
        setEditingLink(false);
        setPickingHighlight(false);
      },
    }),
    [],
  );

  useEffect(() => {
    if (isEditingLink) linkInputRef.current?.focus();
  }, [isEditingLink]);

  function applyHighlight(color: HighlightColor) {
    // Picking the color already applied toggles it off.
    if (active.highlightColor === color) editor.chain().focus().unsetHighlight().run();
    else editor.chain().focus().setHighlight(color).run();
    setPickingHighlight(false);
  }

  function startEditingLink() {
    const currentHref = editor.getAttributes("link").href;
    setLinkValue(typeof currentHref === "string" ? currentHref : "");
    setLinkInvalid(false);
    setEditingLink(true);
  }

  function applyLink() {
    const href = normalizeLinkUrl(linkValue);
    if (!href) {
      setLinkInvalid(true);
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setEditingLink(false);
  }

  function removeLink() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  }

  function handleLinkKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      applyLink();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditingLink(false);
      editor.commands.focus();
    }
  }

  const formatButtons = [
    {
      label: "Bold",
      shortcut: "Ctrl+B",
      icon: Bold,
      isActive: active.bold,
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      shortcut: "Ctrl+I",
      icon: Italic,
      isActive: active.italic,
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Underline",
      shortcut: "Ctrl+U",
      icon: Underline,
      isActive: active.underline,
      run: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Strikethrough",
      shortcut: "Ctrl+Shift+S",
      icon: Strikethrough,
      isActive: active.strike,
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      label: "Code",
      shortcut: "Ctrl+E",
      icon: Code,
      isActive: active.code,
      run: () => editor.chain().focus().toggleCode().run(),
    },
  ];

  return (
    <BubbleMenu
      editor={editor}
      appendTo={() => document.body}
      options={menuOptions}
      className="border-border bg-popover text-popover-foreground z-50 flex items-center gap-0.5 rounded-md border p-1 shadow-lg"
    >
      {isPickingHighlight ? (
        <fieldset className="m-0 flex min-w-0 items-center gap-1 border-0 p-0">
          <legend className="sr-only">Highlight color</legend>
          {HIGHLIGHT_COLORS.map((color) => {
            const isCurrent = active.highlightColor === color;
            return (
              <button
                key={color}
                type="button"
                aria-label={`${color} highlight`}
                aria-pressed={isCurrent}
                title={`${color[0].toUpperCase()}${color.slice(1)} highlight`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyHighlight(color)}
                style={{ backgroundColor: `var(--highlight-${color})` }}
                className="border-border text-foreground flex size-7 items-center justify-center rounded border"
              >
                {isCurrent && <Check className="size-3.5" />}
              </button>
            );
          })}
          {active.highlight && (
            <button
              type="button"
              aria-label="Remove highlight"
              title="Remove highlight"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().unsetHighlight().run();
                setPickingHighlight(false);
              }}
              className={BUTTON_CLASS}
            >
              <Eraser className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            aria-label="Close highlight colors"
            title="Close"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setPickingHighlight(false)}
            className={BUTTON_CLASS}
          >
            <X className="size-3.5" />
          </button>
        </fieldset>
      ) : isEditingLink ? (
        <div className="flex items-center gap-1">
          <input
            ref={linkInputRef}
            type="text"
            value={linkValue}
            onChange={(e) => {
              setLinkValue(e.target.value);
              setLinkInvalid(false);
            }}
            onKeyDown={handleLinkKeyDown}
            placeholder="Paste or type a link"
            aria-label="Link URL"
            aria-invalid={isLinkInvalid}
            className={cn(
              "bg-background text-foreground h-7 w-52 rounded border px-2 text-sm outline-none",
              isLinkInvalid ? "border-destructive" : "border-border focus:border-ring",
            )}
          />
          <button
            type="button"
            aria-label="Apply link"
            title="Apply link"
            onClick={applyLink}
            className={BUTTON_CLASS}
          >
            <Check className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Cancel"
            title="Cancel"
            onClick={() => {
              setEditingLink(false);
              editor.commands.focus();
            }}
            className={BUTTON_CLASS}
          >
            <X className="size-3.5" />
          </button>
          {isLinkInvalid && (
            <span role="alert" className="text-destructive pe-1 text-xs">
              Enter a valid web address
            </span>
          )}
        </div>
      ) : (
        <>
          {formatButtons.map(({ label, shortcut, icon: Icon, isActive, run }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              aria-pressed={isActive}
              title={`${label} (${shortcut})`}
              // Keeps the text selection (and the editor's focus) intact.
              onMouseDown={(e) => e.preventDefault()}
              onClick={run}
              className={cn(BUTTON_CLASS, isActive && BUTTON_ACTIVE_CLASS)}
            >
              <Icon className="size-3.5" />
            </button>
          ))}
          <span className="bg-border mx-0.5 h-4 w-px" aria-hidden="true" />
          <button
            type="button"
            aria-label={active.link ? "Edit link" : "Add link"}
            aria-pressed={active.link}
            title={active.link ? "Edit link" : "Add link"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={startEditingLink}
            className={cn(BUTTON_CLASS, active.link && BUTTON_ACTIVE_CLASS)}
          >
            <Link2 className="size-3.5" />
          </button>
          {active.link && (
            <button
              type="button"
              aria-label="Remove link"
              title="Remove link"
              onMouseDown={(e) => e.preventDefault()}
              onClick={removeLink}
              className={BUTTON_CLASS}
            >
              <Unlink className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            aria-label="Highlight"
            aria-pressed={active.highlight}
            title="Highlight"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setPickingHighlight(true)}
            className={cn(BUTTON_CLASS, active.highlight && BUTTON_ACTIVE_CLASS)}
          >
            <Highlighter className="size-3.5" />
          </button>
        </>
      )}
    </BubbleMenu>
  );
}
