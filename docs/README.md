# Loom documentation

Single entry point for every document in the repository. Start with the [root README](../README.md) for the overview, setup and screenshots.

## Where things are

| I want to…                              | Read                                                                 |
| --------------------------------------- | -------------------------------------------------------------------- |
| Understand and run the project          | [`README.md`](../README.md)                                          |
| Know the rules for changing the code    | [`CLAUDE.md`](../CLAUDE.md) and [`.claude/rules/`](../.claude/rules) |
| See which skills the project needs      | [`skills.md`](skills.md)                                             |
| See what changed and what is still open | [`CHANGELOG.md`](CHANGELOG.md)                                       |
| Learn how tests are organized           | [`src/test/README.md`](../src/test/README.md)                        |
| Understand a feature                    | [Feature guides](#feature-guides) below                              |

## Feature guides

Each feature keeps its guide next to its code, as the feature-first structure in [`CLAUDE.md`](../CLAUDE.md) requires.

| Feature                                          | Covers                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| [editor](../src/features/editor/README.md)       | Block editor: Tiptap blocks, slash menu, wikilinks, autosave, drag-and-drop, boards, tables |
| [pages](../src/features/pages/README.md)         | Page tree rows and page-level actions                                                       |
| [workspace](../src/features/workspace/README.md) | Sidebar page tree and workspace UI                                                          |
| [graph](../src/features/graph/README.md)         | Force-directed global and local graph                                                       |
| [database](../src/features/database/README.md)   | Table view of a page's sub-pages, with sorting, filters and grouping                        |
| [search](../src/features/search/README.md)       | Command palette and fuzzy search                                                            |
| [markdown](../src/features/markdown/README.md)   | Page to Markdown export and Markdown import                                                 |
| [templates](../src/features/templates/README.md) | Saving pages as templates and creating pages from them                                      |
| [settings](../src/features/settings/README.md)   | Settings screens, backup and restore                                                        |

## Layout of documentation files

```text
README.md                    Project overview, setup, screenshots (GitHub landing page)
CLAUDE.md                    Rules and commands for working on the code (read by Claude Code)
docs/
├── README.md                This index
├── CHANGELOG.md             Release notes and known limitations, newest first
├── skills.md                Skills needed for the project, plus Claude Code skills and agents
├── screenshots/             Images used by the root README
└── assets/                  Source artwork that is not shipped in the build
.claude/                     Claude Code configuration (rules, agents, skills, hooks)
src/features/<name>/README.md   Feature guide, next to the code it describes
src/test/README.md              Testing guide, next to the test setup
```

## Conventions

- **Where a document goes:** repository-wide documents live in `docs/`; a document about one feature lives in that feature's folder; files that a tool requires at a fixed path (`README.md`, `CLAUDE.md`, `.claude/`) stay there.
- **Names:** `docs/` files use lowercase kebab-case, except the conventional `README.md` and `CHANGELOG.md`.
- **Links:** relative links only, so they work on GitHub and in an editor.
- **Release notes:** add them to `CHANGELOG.md`, not to new top-level files.
- **Images:** keep them under `docs/screenshots/` (README images) or `docs/assets/` (source artwork), and compress them before committing. Nothing in `public/` unless the app uses it.
- **Formatting:** Prettier owns it (`npm run format:check`).
