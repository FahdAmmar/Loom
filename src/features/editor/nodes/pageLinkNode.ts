import { mergeAttributes, Node } from "@tiptap/core";

export interface PageLinkAttrs {
  pageId: string;
  title: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageLink: {
      insertPageLink: (attrs: PageLinkAttrs) => ReturnType;
    };
  }
}

export const PageLinkNode = Node.create({
  name: "pageLink",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      pageId: { default: null },
      title: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-page-link]",
        getAttrs: (dom) => {
          const el = dom as HTMLElement;
          return {
            pageId: el.getAttribute("data-page-id"),
            title: (el.textContent ?? "").replace(/^↗\s*/, ""),
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-page-link": "",
        "data-page-id": node.attrs.pageId,
        class: "page-link-chip",
      }),
      `↗ ${node.attrs.title}`,
    ];
  },

  addCommands() {
    return {
      insertPageLink:
        (attrs: PageLinkAttrs) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs }).insertContent(" ").run(),
    };
  },
});
