# graph

**Revised after Phase 7 shipped** — the graph was rebuilt to genuinely match
Obsidian's _behavior_ (continuous physics, draggable nodes) on explicit
request, while keeping Loom's own visual language (Structure Violet /
Thread Gold, not Obsidian's actual palette) — the original brief's "do not
clone Notion or Obsidian's UI" instruction was about appearance, and stays
honored; the interaction model is the part that's now genuinely similar.

**`computeGraphLayout.ts`:**

- `createGraphSimulation` returns a **live** d3-force `Simulation` plus its
  mutable `nodes`/`edges` arrays — not a one-shot computed snapshot. The
  caller owns the simulation's lifecycle (tick subscription, `alphaTarget`
  for dragging, `.stop()` on cleanup) and must never recreate those arrays,
  since d3 mutates them in place on every tick
- This is a real reversal of a documented Phase 4/7 decision ("not built:
  live simulation... a graph that visibly jitters into place reads as
  unfinished"). That reasoning held for a graph nobody asked to drag; it
  doesn't hold once dragging with spring-like response is the actual point

**`GraphView`:**

- **Live physics**: settles naturally as d3's alpha decays after load, goes
  idle, reheats (`alphaTarget(0.3)`) the moment you start dragging a node
- **Draggable nodes**: pointer-capture-based, with the drag's move/up events
  kept from bubbling to the background-pan handler on the `<svg>` — the two
  gestures (drag a node vs. pan the canvas) needed to stay fully
  independent, not just "usually work"
- **Positions are updated imperatively**, not through React state — a
  `Map<id, SVGGElement>`/`Map<id, SVGLineElement>` of refs, written directly
  in the simulation's tick callback via `setAttribute`. This is the standard
  pattern for combining d3's continuous animation with React: state-driven
  re-renders handle hover/search/tag-filter styling (infrequent), refs
  handle position (up to 60 times a second). Running position updates
  through `setState` instead would mean a full React re-render on every
  tick — exactly the "excessive re-renders" the brief warns about, for a
  case where it would actually bite
- **Directional arrows** on edges (`sourcePageId → targetPageId` is
  meaningful, so showing it is more accurate, not just more decorative) via
  one shared SVG `<marker>`, with edges trimmed to meet the node circles'
  edges rather than running into their centers
- **Labels fade based on zoom** (hidden below a threshold, always shown for
  the hovered node and its neighbors, or for anything matching an active
  search) — matches Obsidian's declutter-when-zoomed-out behavior and keeps
  a graph of many pages from turning into unreadable text soup
- Tag filtering (Phase 7) and zoom +/− buttons (Phase 7) carried over
  unchanged

**Not built:** a Forces/Groups/Display settings panel with live-adjustable
sliders (Obsidian's actual panel), a local-graph mode (current page + its
immediate neighbors only, rendered in a side panel rather than full-screen).
Both are legitimate, substantial features in their own right rather than
"finish what's already 90% there."

**Still true:** force-directed graphs remain a hard accessibility case —
see the `sr-only` note in the component, unchanged from Phase 4.
