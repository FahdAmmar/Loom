import { useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Check,
  Code,
  Italic,
  Link2,
  Strikethrough,
  Underline,
  Unlink,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

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
      onHide: () => setEditingLink(false),
    }),
    [],
  );

  useEffect(() => {
    if (isEditingLink) linkInputRef.current?.focus();
  }, [isEditingLink]);

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
      {isEditingLink ? (
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
            <span role="alert" className="text-destructive pr-1 text-xs">
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
        </>
      )}
    </BubbleMenu>
  );
}
