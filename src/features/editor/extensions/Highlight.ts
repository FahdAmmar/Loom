import { Mark, mergeAttributes } from "@tiptap/core";

export const HIGHLIGHT_COLORS = ["yellow", "green", "blue", "pink"] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

export function isHighlightColor(value: unknown): value is HighlightColor {
  return HIGHLIGHT_COLORS.some((color) => color === value);
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    highlight: {
      setHighlight: (color: HighlightColor) => ReturnType;
      unsetHighlight: () => ReturnType;
    };
  }
}

/** Background highlight; colors are design tokens (see index.css), never raw values from content. */
export const Highlight = Mark.create({
  name: "highlight",

  addAttributes() {
    return {
      color: {
        default: "yellow",
        // Pasted or stored HTML can carry anything — unknown colors fall back to yellow.
        parseHTML: (element) => {
          const color = element.getAttribute("data-color");
          return isHighlightColor(color) ? color : "yellow";
        },
        renderHTML: (attributes) => ({ "data-color": attributes.color }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "mark" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["mark", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setHighlight:
        (color) =>
        ({ commands }) =>
          commands.setMark(this.name, { color }),
      unsetHighlight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
