# Code style

Formatting is enforced by Prettier (`.prettierrc.json`) and a `PostToolUse` hook runs it automatically after every edit — don't hand-format, and don't fight the hook's output.

- **Quotes/semicolons/commas**: double quotes, semicolons, trailing commas everywhere (`"trailingComma": "all"`), 96-column width. `prettier-plugin-tailwindcss` sorts Tailwind classes — don't manually reorder them.
- **Components**: named exports (`export function EmptyState(...)`), never `export default`. Props typed with an interface named `<Component>Props`, declared just above the component.
- **Imports**: use the `@/` alias (`@/lib/tree`, `@/stores/usePageStore`) for anything outside the current file's own folder. Group external imports above internal `@/` imports, blank line between.
- **Naming**: Zustand stores are `use<Name>Store`. Pure helpers in `src/lib/` are verbs (`buildPageTree`, `flattenVisibleTree`). Test files mirror the file they test: `tree.ts` → `tree.test.ts`.
- **Comments**: sparse, and only for the _why_, not the _what_ — e.g. a one-line note on why a field is client-only, or why a check exists. A short `/** ... */` above a function/field is fine when the reason isn't obvious from the name; don't narrate obvious code.
- **No `any`** without a comment explaining why it's unavoidable there.
- **Linting**: oxlint (`.oxlintrc.json`) enforces `react/rules-of-hooks` as an error, plus `jsx-a11y` rules (`alt-text`, `anchor-is-valid`, `aria-props`, `aria-role`) as errors. `npm run lint` must be zero errors and zero warnings — don't add inline disable comments to silence a real issue; fix it.
