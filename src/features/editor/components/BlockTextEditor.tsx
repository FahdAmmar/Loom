import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect, useRef, useState } from "react";

import { useEditorFocus } from "@/features/editor/useEditorFocus";
import { cn } from "@/lib/utils";

export interface SlashState {
  open: boolean;
  query: string;
  coords?: { x: number; y: number };
}

interface BlockTextEditorProps {
  blockId: string;
  html: string;
  placeholder?: string;
  className?: string;
  onChange: (html: string) => void;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
  onArrowUp: () => void;
  onArrowDown: () => void;
  onSlashStateChange: (state: SlashState) => void;
  /** While the slash menu is open, arrow/enter/escape go here first. Return true to swallow the key. */
  onSlashKeyDown: (key: string) => boolean;
}

export function BlockTextEditor({
  blockId,
  html,
  placeholder,
  className,
  onChange,
  onEnter,
  onBackspaceEmpty,
  onArrowUp,
  onArrowDown,
  onSlashStateChange,
  onSlashKeyDown,
}: BlockTextEditorProps) {
  const { register } = useEditorFocus();
  const [isEmpty, setIsEmpty] = useState(html.trim() === "");
  const isSlashOpenRef = useRef(false);

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
    ],
    content: html,
    editorProps: {
      attributes: {
        class: "outline-none",
        "aria-label": placeholder ?? "Block content",
      },
      handleKeyDown: (view, event) => {
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
    },
  });

  useEffect(() => {
    if (!editor) return;
    return register(blockId, () => editor.commands.focus("end"));
  }, [editor, blockId, register]);

  return (
    <div className="relative min-w-0 flex-1">
      {isEmpty && placeholder && (
        <span className="text-text-faint pointer-events-none absolute inset-0 select-none">
          {placeholder}
        </span>
      )}
      <EditorContent editor={editor} className={cn("prose-block", className)} />
    </div>
  );
}
