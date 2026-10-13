# Skills

What you need to know to work on Loom, where each skill is used in the repository, and where to learn it. The last section covers the Claude Code skills, agents and hooks that ship with the project.

## Contributor skills

### Core — needed for almost every change

| Skill                    | Used for                                                              | Where                                              | Learn                                                                     |
| ------------------------ | --------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------- |
| TypeScript (strict mode) | All code. No `any` without a comment explaining why.                  | `src/`, `tsconfig.app.json`                        | [typescriptlang.org](https://www.typescriptlang.org)                      |
| React 19                 | Components, hooks, `memo`, lazy routes                                | `src/features/`, `src/components/`, `src/layouts/` | [react.dev](https://react.dev)                                            |
| Zustand                  | Shared state, one store per concern                                   | `src/stores/`                                      | [zustand.docs.pmnd.rs](https://zustand.docs.pmnd.rs)                      |
| Tailwind CSS 4           | Styling, design tokens, logical properties (`ms-*`, `pe-*`)           | `src/index.css`, `src/components/ui/`              | [tailwindcss.com](https://tailwindcss.com)                                |
| React Router 8           | Routes and navigation                                                 | `src/App.tsx`, `src/routes/`                       | [reactrouter.com](https://reactrouter.com)                                |
| Async data-layer design  | REST-shaped functions over IndexedDB; only `src/api/` touches storage | `src/api/`                                         | [`.claude/rules/api-conventions.md`](../.claude/rules/api-conventions.md) |

### Feature areas — needed when you touch them

| Skill                       | Used for                                                     | Where                                               | Learn                                                                                 |
| --------------------------- | ------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Tiptap and ProseMirror      | One editor instance per block, custom nodes and marks        | `src/features/editor/`                              | [tiptap.dev](https://tiptap.dev)                                                      |
| d3-force                    | Live graph layout                                            | `src/features/graph/`                               | [d3js.org/d3-force](https://d3js.org/d3-force)                                        |
| dnd-kit                     | Drag-and-drop reordering, Kanban boards                      | `src/features/editor/`                              | [dndkit.com](https://dndkit.com)                                                      |
| Markdown and ZIP processing | Page import and export                                       | `src/features/markdown/`                            | [marked.js.org](https://marked.js.org), [fflate](https://github.com/101arrowz/fflate) |
| Fuzzy search                | Command palette and search filters                           | `src/features/search/`, `src/api/search.ts`         | [fusejs.io](https://www.fusejs.io)                                                    |
| Radix UI primitives         | Dropdown menus, accessible building blocks                   | `src/components/ui/`                                | [radix-ui.com](https://www.radix-ui.com)                                              |
| i18n and RTL layout         | English and Arabic dictionaries, mirrored layout             | `src/i18n/`                                         | [`CHANGELOG.md` → Phase 1](CHANGELOG.md)                                              |
| Web security                | Sanitizing stored HTML, validating backups, sandboxed embeds | `src/lib/html.ts`, `src/api/backupSchema.ts`        | [DOMPurify](https://github.com/cure53/DOMPurify), [zod.dev](https://zod.dev)          |
| PWA and service workers     | Offline support, update prompt                               | `vite.config.ts`, `src/components/UpdatePrompt.tsx` | [vite-pwa-org.netlify.app](https://vite-pwa-org.netlify.app)                          |
| Accessibility               | Semantic HTML, keyboard use, focus states, ARIA when needed  | everywhere; checked in `src/test/a11y.test.tsx`     | [axe-core](https://github.com/dequelabs/axe-core)                                     |

### Quality and tooling

| Skill                      | Used for                                           | Where                                | Learn                                                                                |
| -------------------------- | -------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------ |
| Vitest and Testing Library | Unit and component tests, co-located with the code | `*.test.ts(x)`, `src/test/`          | [vitest.dev](https://vitest.dev), [testing-library.com](https://testing-library.com) |
| Playwright                 | End-to-end tests against the production build      | `e2e/`                               | [playwright.dev](https://playwright.dev)                                             |
| Vite                       | Dev server, build, chunk splitting                 | `vite.config.ts`                     | [vite.dev](https://vite.dev)                                                         |
| oxlint and Prettier        | Lint (0 warnings) and formatting                   | `.oxlintrc.json`, `.prettierrc.json` | [oxc.rs](https://oxc.rs), [prettier.io](https://prettier.io)                         |
| Node.js 22.22.2+ and npm   | Running the project (`npm ci`)                     | `package.json`                       | [nodejs.org](https://nodejs.org)                                                     |

## Claude Code skills, agents and hooks

Everything here lives in `.claude/` (the location Claude Code requires) and is described in [`CLAUDE.md`](../CLAUDE.md).

### Skills (slash commands)

| Command                    | What it does                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `/verify`                  | Runs the four gates in order and stops at the first failure: typecheck, lint, test, build                    |
| `/review`                  | Reviews uncommitted changes against the architecture and style rules, using the `code-reviewer` agent        |
| `/fix-issue [description]` | Reproduce, find the root cause, make the smallest fix, add a regression test, then `/verify`                 |
| `/new-feature [name]`      | Scaffolds `src/features/<name>/` with `components/` and a `README.md`, following the feature-first structure |

### Agents

| Agent              | Use it for                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `code-reviewer`    | Architecture, style and security review of uncommitted changes                                |
| `security-auditor` | XSS, injection and data-exposure risks after touching Markdown, Tiptap, embeds or HTML output |
| `test-writer`      | Vitest tests for `src/lib/`, `src/stores/` and `src/api/`                                     |

### Rules and hooks

- **Rules** in `.claude/rules/`: `architecture.md`, `api-conventions.md`, `code-style.md`, `testing.md`.
- **Hooks** in `.claude/hooks/`: `format-file.sh` runs Prettier on every edited file, and `validate-bash.sh` blocks a short list of clearly destructive shell commands.
