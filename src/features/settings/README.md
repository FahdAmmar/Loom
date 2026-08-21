# settings

Additional settings screens beyond Appearance (already live at
/settings) — account, workspace preferences. Grows across later phases.

**Implemented: import & export.** `api/backup.ts` serializes every table
(pages, blocks, links, tags, pageTags, pageProperties, templates) scoped to
one workspace into a portable JSON shape, independent of how the mock DB
keys things internally. Export triggers a browser download; import reads a
file, does a lightweight structural check (not full schema validation),
shows a `ConfirmDialog` naming the workspace and page count from the file,
and — on confirm — fully **replaces** the target workspace's data rather
than merging it, so importing the same file twice can't create duplicates.
A full page reload after a successful import is the simplest way to get
every store (pages, tags, editor, ...) to reflect the restored data
correctly, rather than hand-invalidating each cache individually.
