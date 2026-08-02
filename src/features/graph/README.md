# graph

**Implemented (Phase 4):**

- `computeGraphLayout` — runs a d3-force simulation (link/charge/center/
  collide forces) for 300 ticks synchronously and returns a _settled_
  layout. Deliberately not animated live — a graph that visibly jitters into
  place reads as unfinished, not "alive"
- `GraphView` — every page is a node (even unconnected ones — an isolated
  page is useful information, not noise to hide); edges come from
  `listAllLinks()`. Pan (drag) and zoom (wheel, toward the cursor) are
  hand-rolled SVG transforms — no d3-zoom, to avoid a second dependency for
  something this contained. Search dims non-matching nodes; hovering a node
  dims everything except it and its direct neighbors; clicking navigates to
  that page

**Not built:** tag filtering — the brief's general spec mentions it, but
Tags themselves don't exist until Phase 6, so there's nothing to filter by
yet. Also not built: exposing the physics simulation live (drag-to-reposition
nodes) — the settled layout is fixed once computed.

**A known, real limitation:** force-directed graphs are a well-known hard
case for accessibility — there's no meaningful non-visual way to explore a
spatial node-link diagram. `GraphView` is honest about this (a `sr-only`
note points screen reader users back to the sidebar's page list, which
covers the same "browse all pages" need) rather than pretending an ARIA
attribute solves it.
