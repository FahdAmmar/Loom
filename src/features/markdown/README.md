# markdown

Converts a page's blocks to and from Markdown — `exportMarkdown.ts` one
way, `importMarkdown.ts` the other. They're deliberately built with
different strategies, not out of inconsistency:

**Export is hand-rolled. Import uses `marked`.** Export only ever
converts HTML that Loom's own Tiptap config produced — a small, fully
known set of tags (`<strong>`, `<em>`, `<code>`, `<s>`, wikilink chips).
Walking that with a small recursive DOM function
(`inlineHtmlToMarkdown` in `lib/blocks.ts`) is simpler than pulling in a
renderer for it. Import has to handle Markdown from _anywhere_ — a real
Obsidian vault, a GitHub README, a file some other tool wrote — and
parsing arbitrary third-party Markdown correctly (nested emphasis,
tables, task lists, edge cases) is a genuinely well-solved problem. Not
reusing that solution would mean reinventing a worse version of it.

**Wikilinks resolve in two passes, not one.** `markdownToBlocks` is a
synchronous, side-effect-free function: given the raw text and a
`resolveTitle(title) => pageId | null` lookup, it returns block drafts.
It does **not** create pages itself. The caller (see
`CommandPalette.tsx`'s import handler) runs `extractWikilinkTitles` over
the whole document first, resolves each title against existing pages, and
creates a new (empty) page for any that don't match — all before calling
`markdownToBlocks` at all. This keeps the actual parsing pure and
testable in isolation, with every async, page-creating side effect
confined to one clearly separate step.

**`createPage` calls during that resolution pass stay sequential, not
`Promise.all`'d.** `createPage` reads the current sibling count to assign
each new page's `order` — running several calls in parallel would have
them all read the same "before" count and race on it. Contrast this with
the _block_-link-sync loop right after (each `syncBlockLinks` call targets
a different, independent block id) — that one **is** parallelized. Same
file, two similar-looking loops, different concurrency answers, because
the underlying data dependencies are different. See the comment at each
call site, not just this note.

**What doesn't round-trip, on purpose:**

- A callout and a plain quote both export as `> ...` — there's no way to
  tell them apart coming back in, so a blockquote always imports as a
  quote block
- A toggle exports as `<details><summary>...</summary>...</details>`,
  which Markdown/`marked` has no native block type for — reconstructing a
  toggle would mean parsing Markdown _inside_ raw HTML content recursively.
  Not attempted; an imported `<details>` block shows up as a plain
  paragraph containing its own raw source, not silently dropped
- A board block exports as headings + lists (readable, useful outside
  Loom) — reimporting that content becomes a paragraph and bullet lists,
  not a reconstructed board. No "was this originally a board" detection
  is attempted; that would be guessing from shape, not data
- A hyperlink (`[text](url)`) imports as plain text with the URL
  dropped — the editor has no hyperlink mark at all (only the wikilink
  node), so there's nothing to import it _into_
