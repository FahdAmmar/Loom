import { idbGet, idbSet } from "@/api/idbStorage";
import { extractPageLinkIdsFromHtml } from "@/lib/blocks";
import type {
  Block,
  Link,
  Page,
  PageProperty,
  PageTag,
  PageVersion,
  Tag,
  Template,
  Workspace,
} from "@/types/entities";

/** Key inside the IndexedDB "kv" store that the whole database is persisted under. */
const IDB_KEY = "loom-db-v1";
/** Where the database lived before the IndexedDB migration — read once, at startup, to migrate existing users forward. */
const LEGACY_LOCALSTORAGE_KEY = "loom-mock-db-v5";
const DEFAULT_WORKSPACE_ID = "default";

export interface MockDb {
  workspaces: Record<string, Workspace>;
  pages: Record<string, Page>;
  blocks: Record<string, Block>;
  links: Record<string, Link>;
  tags: Record<string, Tag>;
  pageTags: Record<string, PageTag>;
  pageProperties: Record<string, PageProperty>;
  templates: Record<string, Template>;
  pageVersions: Record<string, PageVersion>;
}

let blockOrder = 0;
function block(
  pageId: string,
  type: Block["type"],
  content: Block["content"],
  parentBlockId: string | null = null,
): Block {
  return {
    id: `block-${crypto.randomUUID()}`,
    pageId,
    parentBlockId,
    type,
    content,
    order: blockOrder++,
  };
}

/** Matches exactly what the pageLink Tiptap node renders — see features/editor/nodes/pageLinkNode.ts. */
function pageLinkHtml(page: Page): string {
  return `<span data-page-link data-page-id="${page.id}" class="page-link-chip">↗ ${page.title}</span>`;
}

/**
 * A self-contained, on-brand placeholder image for seed data — an inline
 * SVG data URI rather than a hotlinked external service, so the image
 * block demo never depends on a third party being reachable or online.
 */
function placeholderImageUrl(
  bg: string,
  fg: string,
  label: string,
  w: number,
  h: number,
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" fill="${fg}" font-family="system-ui, sans-serif" font-size="${Math.round(h / 9)}" font-weight="600" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function seedDb(): MockDb {
  const now = new Date().toISOString();
  const workspace: Workspace = {
    id: DEFAULT_WORKSPACE_ID,
    name: "My Workspace",
    ownerId: "user-1",
    createdAt: now,
  };

  const welcome: Page = {
    id: "page-welcome",
    workspaceId: DEFAULT_WORKSPACE_ID,
    parentId: null,
    title: "Welcome to Loom",
    isFavorite: false,
    order: 0,
    createdAt: now,
    updatedAt: now,
  };
  const gettingStarted: Page = {
    id: "page-getting-started",
    workspaceId: DEFAULT_WORKSPACE_ID,
    parentId: welcome.id,
    title: "Getting started",
    isFavorite: false,
    order: 0,
    createdAt: now,
    updatedAt: now,
  };
  const whyTwoIdeas: Page = {
    id: "page-why-two-ideas",
    workspaceId: DEFAULT_WORKSPACE_ID,
    parentId: welcome.id,
    title: "Why pages and a graph",
    isFavorite: false,
    order: 1,
    createdAt: now,
    updatedAt: now,
  };
  const ideas: Page = {
    id: "page-ideas",
    workspaceId: DEFAULT_WORKSPACE_ID,
    parentId: null,
    title: "Ideas",
    isFavorite: false,
    order: 1,
    createdAt: now,
    updatedAt: now,
  };

  // --- Showcase pages: a "Notes" hub with three sub-pages, plus two more
  // top-level pages — together these exercise every block type, all five
  // property types, tags, nested toggle children, and a small web of
  // wikilinks so Backlinks and the Graph View have something real to show.
  const notes: Page = {
    id: "page-notes",
    workspaceId: DEFAULT_WORKSPACE_ID,
    parentId: null,
    title: "Notes",
    isFavorite: true,
    order: 2,
    createdAt: now,
    updatedAt: now,
  };
  const meetingNotes: Page = {
    id: "page-meeting-notes",
    workspaceId: DEFAULT_WORKSPACE_ID,
    parentId: notes.id,
    title: "Meeting notes — Q3 planning",
    isFavorite: false,
    order: 0,
    createdAt: now,
    updatedAt: now,
  };
  const researchNotes: Page = {
    id: "page-research-notes",
    workspaceId: DEFAULT_WORKSPACE_ID,
    parentId: notes.id,
    title: "Research notes — graph databases",
    isFavorite: false,
    order: 1,
    createdAt: now,
    updatedAt: now,
  };
  const readingList: Page = {
    id: "page-reading-list",
    workspaceId: DEFAULT_WORKSPACE_ID,
    parentId: notes.id,
    title: "Reading list",
    isFavorite: false,
    order: 2,
    createdAt: now,
    updatedAt: now,
  };
  const projectRoadmap: Page = {
    id: "page-project-roadmap",
    workspaceId: DEFAULT_WORKSPACE_ID,
    parentId: null,
    title: "Project roadmap",
    isFavorite: true,
    order: 3,
    createdAt: now,
    updatedAt: now,
  };
  const designSystem: Page = {
    id: "page-design-system",
    workspaceId: DEFAULT_WORKSPACE_ID,
    parentId: null,
    title: "Design system",
    isFavorite: false,
    order: 4,
    createdAt: now,
    updatedAt: now,
  };

  blockOrder = 0;
  const welcomeBlocks = [
    block(welcome.id, "heading1", { html: "Welcome to Loom" }),
    block(welcome.id, "paragraph", {
      html: "This page is a <strong>block editor</strong> — every paragraph, heading, and list item below is its own block. Try typing <code>/</code> on a new line to see the command menu.",
    }),
    block(welcome.id, "callout", {
      html: `Type <code>[[</code> anywhere to link to another page — try it, or follow the one already here: ${pageLinkHtml(gettingStarted)}.`,
    }),
    block(welcome.id, "heading2", { html: "What you can do here" }),
    block(welcome.id, "bulletList", { html: "Write in paragraphs, headings, and lists" }),
    block(welcome.id, "bulletList", {
      html: "Use <strong>bold</strong>, <em>italic</em>, and <code>inline code</code>",
    }),
    block(welcome.id, "checklist", { html: "Check things off as you go", checked: true }),
    block(welcome.id, "checklist", { html: "This one's still open", checked: false }),
    block(welcome.id, "quote", {
      html: "A page is just a list of blocks. That's the whole trick.",
    }),
    block(welcome.id, "code", {
      code: "// blocks are plain data — this whole page is an array of these\ninterface Block {\n  type: BlockType;\n  content: Record<string, unknown>;\n}",
      language: "ts",
    }),
    block(welcome.id, "paragraph", {
      html: `See also: ${pageLinkHtml(whyTwoIdeas)} and ${pageLinkHtml(ideas)}.`,
    }),
    block(welcome.id, "divider", {}),
    block(welcome.id, "paragraph", {
      html: `Want to see more of what a real workspace looks like? ${pageLinkHtml(notes)} holds a few different note styles, and the ${pageLinkHtml(projectRoadmap)} shows tables and properties in action.`,
    }),
  ];

  blockOrder = 0;
  const gettingStartedBlocks = [
    block(gettingStarted.id, "paragraph", {
      html: `Click the <strong>+</strong> next to any page in the sidebar to add a sub-page, or the <strong>/</strong> menu here to add a new kind of block. Head back to ${pageLinkHtml(welcome)} any time.`,
    }),
    block(gettingStarted.id, "paragraph", {
      html: "You can also embed a YouTube video — type <code>/embed</code>, or pick it from the slash menu:",
    }),
    block(gettingStarted.id, "embed", {
      url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    }),
  ];

  blockOrder = 0;
  const ideasBlocks = [
    block(ideas.id, "paragraph", {
      html: `A loose page, not nested under anything — but still linked from ${pageLinkHtml(welcome)}. The graph in Phase 4 draws connections like this one regardless of where a page sits in the tree.`,
    }),
  ];

  blockOrder = 0;
  const notesBlocks = [
    block(notes.id, "heading1", { html: "Notes" }),
    block(notes.id, "paragraph", {
      html: "A home for anything that isn't quite a full page of its own yet — meeting notes, research, and a running reading list.",
    }),
  ];
  const notesToggle = block(notes.id, "toggle", { html: "What kind of notes go here?" });
  notesBlocks.push(
    notesToggle,
    block(
      notes.id,
      "bulletList",
      { html: "Fleeting thoughts you don't want to lose" },
      notesToggle.id,
    ),
    block(
      notes.id,
      "bulletList",
      { html: "Structured meeting notes, complete with action items" },
      notesToggle.id,
    ),
    block(
      notes.id,
      "bulletList",
      { html: "Reference material you'll come back and link to later" },
      notesToggle.id,
    ),
    block(notes.id, "divider", {}),
    block(notes.id, "heading2", { html: "Browse" }),
    block(notes.id, "database", { viewType: "table" }),
  );

  blockOrder = 0;
  const meetingNotesBlocks = [
    block(meetingNotes.id, "heading1", { html: "Meeting notes — Q3 planning" }),
    block(meetingNotes.id, "paragraph", {
      html: "<strong>Attendees:</strong> Sara, Marcus, Priya, Devon",
    }),
    block(meetingNotes.id, "heading3", { html: "Agenda" }),
    block(meetingNotes.id, "table", {
      rows: [
        ["Topic", "Owner", "Time"],
        ["Q3 goals review", "Sara", "10 min"],
        ["Roadmap alignment", "Marcus", "15 min"],
        ["Open questions", "Everyone", "10 min"],
      ],
    }),
    block(meetingNotes.id, "heading3", { html: "Action items" }),
    block(meetingNotes.id, "checklist", {
      html: "Sara to share the updated timeline by Friday",
      checked: true,
    }),
    block(meetingNotes.id, "checklist", {
      html: "Marcus to scope the mobile layout pass",
      checked: false,
    }),
    block(meetingNotes.id, "checklist", {
      html: "Priya to draft the template gallery redesign",
      checked: false,
    }),
    block(meetingNotes.id, "quote", {
      html: "Decision: ship the public beta before adding the workspace switcher, not after.",
    }),
    block(meetingNotes.id, "paragraph", {
      html: `Back to ${pageLinkHtml(notes)}. Feeds directly into the ${pageLinkHtml(projectRoadmap)}.`,
    }),
  ];

  blockOrder = 0;
  const researchNotesBlocks = [
    block(researchNotes.id, "heading1", { html: "Research notes — graph databases" }),
    block(researchNotes.id, "paragraph", {
      html: "Looking into how a force-directed layout should behave once a workspace has a few hundred pages instead of a handful.",
    }),
    block(researchNotes.id, "callout", {
      html: "Key insight: capping node radius by degree (not letting one hub page dwarf everything) matters more for readability than the exact charge strength.",
    }),
    block(researchNotes.id, "code", {
      code: "MATCH (p:Page)-[:LINKS_TO]->(target:Page)\nRETURN p.title, count(target) AS outDegree\nORDER BY outDegree DESC",
      language: "cypher",
    }),
  ];
  const sourcesToggle = block(researchNotes.id, "toggle", { html: "Sources" });
  researchNotesBlocks.push(
    sourcesToggle,
    block(
      researchNotes.id,
      "bulletList",
      { html: "Neo4j — Graph Data Science documentation" },
      sourcesToggle.id,
    ),
    block(
      researchNotes.id,
      "bulletList",
      { html: "Kleppmann, <em>Designing Data-Intensive Applications</em>, ch. 2" },
      sourcesToggle.id,
    ),
    block(
      researchNotes.id,
      "bulletList",
      { html: "Obsidian forum — notes on local-graph rendering performance" },
      sourcesToggle.id,
    ),
    block(researchNotes.id, "quote", {
      html: "The graph is the notes talking to each other. The page is just where one of them happens to live.",
    }),
    block(researchNotes.id, "paragraph", {
      html: `Back to ${pageLinkHtml(notes)}. Related: ${pageLinkHtml(projectRoadmap)}.`,
    }),
  );

  blockOrder = 0;
  const readingListBlocks = [
    block(readingList.id, "paragraph", {
      html: "Books informing how Loom's editor and graph are built, roughly in the order they're worth reading.",
    }),
    block(readingList.id, "table", {
      rows: [
        ["Title", "Author", "Status"],
        ["Designing Data-Intensive Applications", "Martin Kleppmann", "Reading"],
        ["A Pattern Language", "Christopher Alexander", "Not started"],
        ["The Design of Everyday Things", "Don Norman", "Finished"],
      ],
    }),
    block(readingList.id, "numberedList", {
      html: "Data-Intensive Applications — active work",
    }),
    block(readingList.id, "numberedList", { html: "The Design of Everyday Things — a reread" }),
    block(readingList.id, "numberedList", { html: "A Pattern Language — queued next" }),
    block(readingList.id, "divider", {}),
    block(readingList.id, "paragraph", { html: `Back to ${pageLinkHtml(notes)}.` }),
  ];

  blockOrder = 0;
  const projectRoadmapBlocks = [
    block(projectRoadmap.id, "heading1", { html: "Project roadmap" }),
    block(projectRoadmap.id, "paragraph", {
      html: "What's shipping next, pulled together from planning meetings and open research.",
    }),
    block(projectRoadmap.id, "image", {
      url: placeholderImageUrl("#5a46d6", "#ffffff", "Q3 Roadmap", 960, 360),
      alt: "Q3 roadmap banner",
      caption: "Placeholder banner — swap for a real cover image any time.",
    }),
    block(projectRoadmap.id, "heading2", { html: "Milestones" }),
    block(projectRoadmap.id, "table", {
      rows: [
        ["Milestone", "Owner", "Due", "Status"],
        ["Public beta", "Sara", "2026-09-30", "In progress"],
        ["Mobile layout pass", "Marcus", "2026-10-15", "Not started"],
        ["Template gallery v2", "Priya", "2026-11-01", "Not started"],
      ],
    }),
    block(projectRoadmap.id, "heading2", { html: "Backlog" }),
    block(projectRoadmap.id, "checklist", {
      html: "Workspace switcher — deferred until multi-workspace is needed",
      checked: false,
    }),
    block(projectRoadmap.id, "checklist", {
      html: "Drag-and-drop reordering for pages and blocks",
      checked: false,
    }),
    block(projectRoadmap.id, "checklist", { html: "Real image upload", checked: false }),
    block(projectRoadmap.id, "heading2", { html: "Sprint board" }),
    block(projectRoadmap.id, "paragraph", {
      html: "The same backlog, organized as a board — drag cards across columns as work moves. Click a card's icon to change it.",
    }),
    block(projectRoadmap.id, "board", {
      columns: [
        {
          id: "col-roadmap-todo",
          title: "To Do",
          color: "gold",
          cards: [
            { id: "card-roadmap-1", title: "Workspace switcher", icon: "🔀" },
            { id: "card-roadmap-2", title: "Real image upload", icon: "🖼️" },
          ],
        },
        {
          id: "col-roadmap-doing",
          title: "Doing",
          color: "violet",
          cards: [{ id: "card-roadmap-3", title: "Mobile layout pass", icon: "📱" }],
        },
        {
          id: "col-roadmap-done",
          title: "Done",
          color: "mint",
          icon: "✅",
          cards: [
            { id: "card-roadmap-4", title: "Drag-and-drop reordering", icon: "🎯" },
            { id: "card-roadmap-5", title: "Public beta milestone table", icon: "📊" },
          ],
        },
      ],
    }),
    block(projectRoadmap.id, "callout", {
      html: `Sourced from ${pageLinkHtml(meetingNotes)} and ${pageLinkHtml(researchNotes)}. Visual language lives in ${pageLinkHtml(designSystem)}.`,
    }),
  ];

  blockOrder = 0;
  const designSystemBlocks = [
    block(designSystem.id, "heading1", { html: "Design system" }),
    block(designSystem.id, "paragraph", {
      html: "The token set behind every color, radius, and spacing value in the app — one source of truth in <code>index.css</code>.",
    }),
    block(designSystem.id, "heading2", { html: "Colors" }),
    block(designSystem.id, "table", {
      rows: [
        ["Token", "Hex", "Usage"],
        ["Thread Gold", "#9c6b23", "Links, primary actions"],
        ["Structure Violet", "#5a46d6", "Graph edges, wikilinks"],
        ["Growth Mint", "#187e5e", "Success states, checkboxes"],
      ],
    }),
    block(designSystem.id, "image", {
      url: placeholderImageUrl("#9c6b23", "#fff8ec", "Loom", 480, 480),
      alt: "Loom logo mark placeholder",
      caption: "Logo mark placeholder.",
    }),
    block(designSystem.id, "heading2", { html: "Tokens in code" }),
    block(designSystem.id, "code", {
      code: "--color-brand-gold: var(--brand-gold);\n--color-brand-violet: var(--brand-violet);\n--color-brand-mint: var(--brand-mint);",
      language: "css",
    }),
    block(designSystem.id, "callout", {
      html: `Applied across the ${pageLinkHtml(projectRoadmap)} and the Graph View's edges.`,
    }),
  ];

  const allBlocks = [
    ...welcomeBlocks,
    ...gettingStartedBlocks,
    ...ideasBlocks,
    ...notesBlocks,
    ...meetingNotesBlocks,
    ...researchNotesBlocks,
    ...readingListBlocks,
    ...projectRoadmapBlocks,
    ...designSystemBlocks,
  ];

  const links: Record<string, Link> = {};
  for (const b of allBlocks) {
    if (typeof b.content.html !== "string") continue;
    for (const targetPageId of extractPageLinkIdsFromHtml(b.content.html)) {
      if (targetPageId === b.pageId) continue; // no self-links
      const link: Link = {
        id: `link-${crypto.randomUUID()}`,
        sourcePageId: b.pageId,
        targetPageId,
        sourceBlockId: b.id,
      };
      links[link.id] = link;
    }
  }

  const guideTag: Tag = {
    id: "tag-guide",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Guide",
    color: "gold",
  };
  const metaTag: Tag = {
    id: "tag-meta",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Meta",
    color: "violet",
  };
  const meetingTag: Tag = {
    id: "tag-meeting",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Meeting",
    color: "mint",
  };
  const researchTag: Tag = {
    id: "tag-research",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Research",
    color: "gold",
  };
  const designTag: Tag = {
    id: "tag-design",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Design",
    color: "violet",
  };
  const planningTag: Tag = {
    id: "tag-planning",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Planning",
    color: "mint",
  };
  const readingTag: Tag = {
    id: "tag-reading",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Reading",
    color: "gold",
  };
  const pageTagList: PageTag[] = [
    { pageId: gettingStarted.id, tagId: guideTag.id },
    { pageId: welcome.id, tagId: metaTag.id },
    { pageId: whyTwoIdeas.id, tagId: metaTag.id },
    { pageId: notes.id, tagId: guideTag.id },
    { pageId: meetingNotes.id, tagId: meetingTag.id },
    { pageId: meetingNotes.id, tagId: planningTag.id },
    { pageId: researchNotes.id, tagId: researchTag.id },
    { pageId: readingList.id, tagId: readingTag.id },
    { pageId: projectRoadmap.id, tagId: planningTag.id },
    { pageId: projectRoadmap.id, tagId: guideTag.id },
    { pageId: designSystem.id, tagId: designTag.id },
    { pageId: designSystem.id, tagId: metaTag.id },
  ];

  const statusProperty: PageProperty = {
    id: "prop-welcome-status",
    pageId: welcome.id,
    key: "Status",
    type: "select",
    value: "Published",
  };

  // One property of each of the five types, spread across pages, so the
  // property editor is exercised end to end rather than just "select".
  const meetingProperties: PageProperty[] = [
    {
      id: "prop-meeting-date",
      pageId: meetingNotes.id,
      key: "Date",
      type: "date",
      value: "2026-08-10",
    },
    {
      id: "prop-meeting-attendees",
      pageId: meetingNotes.id,
      key: "Attendees",
      type: "number",
      value: 4,
    },
    {
      id: "prop-meeting-status",
      pageId: meetingNotes.id,
      key: "Status",
      type: "select",
      value: "In progress",
    },
  ];
  const researchProperties: PageProperty[] = [
    {
      id: "prop-research-status",
      pageId: researchNotes.id,
      key: "Status",
      type: "select",
      value: "Published",
    },
    {
      id: "prop-research-reviewed",
      pageId: researchNotes.id,
      key: "Reviewed",
      type: "checkbox",
      value: true,
    },
  ];
  const roadmapProperties: PageProperty[] = [
    {
      id: "prop-roadmap-status",
      pageId: projectRoadmap.id,
      key: "Status",
      type: "select",
      value: "In progress",
    },
    {
      id: "prop-roadmap-priority",
      pageId: projectRoadmap.id,
      key: "Priority",
      type: "number",
      value: 1,
    },
    {
      id: "prop-roadmap-due",
      pageId: projectRoadmap.id,
      key: "Due",
      type: "date",
      value: "2026-09-30",
    },
    {
      id: "prop-roadmap-shipped",
      pageId: projectRoadmap.id,
      key: "Shipped",
      type: "checkbox",
      value: false,
    },
  ];
  const designProperties: PageProperty[] = [
    {
      id: "prop-design-status",
      pageId: designSystem.id,
      key: "Status",
      type: "select",
      value: "Published",
    },
    {
      id: "prop-design-owner",
      pageId: designSystem.id,
      key: "Owner",
      type: "text",
      value: "Design guild",
    },
  ];
  const allProperties = [
    statusProperty,
    ...meetingProperties,
    ...researchProperties,
    ...roadmapProperties,
    ...designProperties,
  ];

  const meetingTemplate: Template = {
    id: "template-meeting-notes",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Meeting notes",
    blocks: [
      { type: "heading2", content: { html: "Meeting notes" }, order: 0 },
      { type: "paragraph", content: { html: "<strong>Date:</strong> " }, order: 1 },
      { type: "paragraph", content: { html: "<strong>Attendees:</strong> " }, order: 2 },
      { type: "heading3", content: { html: "Agenda" }, order: 3 },
      { type: "bulletList", content: { html: "" }, order: 4 },
      { type: "heading3", content: { html: "Action items" }, order: 5 },
      { type: "checklist", content: { html: "", checked: false }, order: 6 },
    ],
  };

  const projectBriefTemplate: Template = {
    id: "template-project-brief",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Project brief",
    blocks: [
      { type: "heading2", content: { html: "Project brief" }, order: 0 },
      { type: "paragraph", content: { html: "<strong>Summary:</strong> " }, order: 1 },
      { type: "heading3", content: { html: "Goals" }, order: 2 },
      { type: "bulletList", content: { html: "" }, order: 3 },
      { type: "heading3", content: { html: "Non-goals" }, order: 4 },
      { type: "bulletList", content: { html: "" }, order: 5 },
      { type: "heading3", content: { html: "Timeline" }, order: 6 },
      {
        type: "table",
        content: {
          rows: [
            ["Milestone", "Owner", "Due"],
            ["", "", ""],
          ],
        },
        order: 7,
      },
      { type: "callout", content: { html: "Risks: " }, order: 8 },
    ],
  };

  const weeklyPlannerTemplate: Template = {
    id: "template-weekly-planner",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Weekly planner",
    blocks: [
      { type: "heading2", content: { html: "Week of " }, order: 0 },
      {
        type: "table",
        content: {
          rows: [
            ["Day", "Focus", "Notes"],
            ["Mon", "", ""],
            ["Tue", "", ""],
            ["Wed", "", ""],
            ["Thu", "", ""],
            ["Fri", "", ""],
          ],
        },
        order: 1,
      },
      { type: "heading3", content: { html: "Top priority this week" }, order: 2 },
      { type: "checklist", content: { html: "", checked: false }, order: 3 },
      { type: "checklist", content: { html: "", checked: false }, order: 4 },
      { type: "checklist", content: { html: "", checked: false }, order: 5 },
    ],
  };

  const readingNotesTemplate: Template = {
    id: "template-reading-notes",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Reading notes",
    blocks: [
      { type: "heading2", content: { html: "" }, order: 0 },
      { type: "paragraph", content: { html: "<strong>Author:</strong> " }, order: 1 },
      { type: "quote", content: { html: "" }, order: 2 },
      { type: "heading3", content: { html: "Key takeaways" }, order: 3 },
      { type: "numberedList", content: { html: "" }, order: 4 },
      { type: "numberedList", content: { html: "" }, order: 5 },
      { type: "numberedList", content: { html: "" }, order: 6 },
      { type: "heading3", content: { html: "My rating" }, order: 7 },
      { type: "paragraph", content: { html: "" }, order: 8 },
    ],
  };

  const designCritiqueTemplate: Template = {
    id: "template-design-critique",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Design critique",
    blocks: [
      { type: "heading2", content: { html: "Design critique" }, order: 0 },
      {
        type: "paragraph",
        content: { html: "<strong>What's being reviewed:</strong> " },
        order: 1,
      },
      { type: "heading3", content: { html: "What's working" }, order: 2 },
      { type: "bulletList", content: { html: "" }, order: 3 },
      { type: "heading3", content: { html: "What could improve" }, order: 4 },
      { type: "bulletList", content: { html: "" }, order: 5 },
      { type: "heading3", content: { html: "Follow-ups" }, order: 6 },
      { type: "checklist", content: { html: "", checked: false }, order: 7 },
    ],
  };

  // A board block's "children" are its columns/cards, all nested inside
  // that one block's own content — unlike a toggle's children, they don't
  // need the parent-child block shape templates otherwise can't capture
  // (see the templates feature README), so a board template is just one
  // more flat block like any other.
  const todoBoardTemplate: Template = {
    id: "template-todo-board",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Todo board",
    blocks: [
      { type: "heading2", content: { html: "Todo board" }, order: 0 },
      {
        type: "paragraph",
        content: {
          html: "Drag cards between columns as work moves. Click a card's icon to change it.",
        },
        order: 1,
      },
      {
        type: "board",
        content: {
          columns: [
            {
              id: "col-todo-1",
              title: "To Do",
              color: "gold",
              cards: [
                {
                  id: "card-todo-1",
                  title: "Try dragging this card to another column",
                  icon: "👋",
                },
              ],
            },
            { id: "col-todo-2", title: "Doing", color: "violet", cards: [] },
            { id: "col-todo-3", title: "Done", color: "mint", icon: "✅", cards: [] },
          ],
        },
        order: 2,
      },
    ],
  };

  const bugTrackerTemplate: Template = {
    id: "template-bug-tracker",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Bug tracker",
    blocks: [
      { type: "heading2", content: { html: "Bug tracker" }, order: 0 },
      {
        type: "paragraph",
        content: { html: "Track issues from report to resolution." },
        order: 1,
      },
      {
        type: "board",
        content: {
          columns: [
            { id: "col-bug-1", title: "Open", color: "gold", icon: "🐛", cards: [] },
            { id: "col-bug-2", title: "In Progress", color: "violet", icon: "🔧", cards: [] },
            { id: "col-bug-3", title: "Resolved", color: "mint", icon: "✅", cards: [] },
          ],
        },
        order: 2,
      },
    ],
  };

  const dailyJournalTemplate: Template = {
    id: "template-daily-journal",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Daily journal",
    blocks: [
      { type: "heading2", content: { html: "Journal entry" }, order: 0 },
      { type: "paragraph", content: { html: "<strong>Date:</strong> " }, order: 1 },
      { type: "heading3", content: { html: "How am I feeling today?" }, order: 2 },
      { type: "paragraph", content: { html: "" }, order: 3 },
      { type: "heading3", content: { html: "What's on my mind" }, order: 4 },
      { type: "paragraph", content: { html: "" }, order: 5 },
      { type: "quote", content: { html: "" }, order: 6 },
      { type: "heading3", content: { html: "Grateful for" }, order: 7 },
      { type: "bulletList", content: { html: "" }, order: 8 },
      { type: "bulletList", content: { html: "" }, order: 9 },
      { type: "bulletList", content: { html: "" }, order: 10 },
    ],
  };

  return {
    workspaces: { [workspace.id]: workspace },
    pages: {
      [welcome.id]: welcome,
      [gettingStarted.id]: gettingStarted,
      [whyTwoIdeas.id]: whyTwoIdeas,
      [ideas.id]: ideas,
      [notes.id]: notes,
      [meetingNotes.id]: meetingNotes,
      [researchNotes.id]: researchNotes,
      [readingList.id]: readingList,
      [projectRoadmap.id]: projectRoadmap,
      [designSystem.id]: designSystem,
    },
    blocks: Object.fromEntries(allBlocks.map((b) => [b.id, b])),
    links,
    tags: {
      [guideTag.id]: guideTag,
      [metaTag.id]: metaTag,
      [meetingTag.id]: meetingTag,
      [researchTag.id]: researchTag,
      [designTag.id]: designTag,
      [planningTag.id]: planningTag,
      [readingTag.id]: readingTag,
    },
    pageTags: Object.fromEntries(pageTagList.map((pt) => [`${pt.pageId}:${pt.tagId}`, pt])),
    pageProperties: Object.fromEntries(allProperties.map((p) => [p.id, p])),
    templates: {
      [meetingTemplate.id]: meetingTemplate,
      [projectBriefTemplate.id]: projectBriefTemplate,
      [weeklyPlannerTemplate.id]: weeklyPlannerTemplate,
      [readingNotesTemplate.id]: readingNotesTemplate,
      [designCritiqueTemplate.id]: designCritiqueTemplate,
      [todoBoardTemplate.id]: todoBoardTemplate,
      [bugTrackerTemplate.id]: bugTrackerTemplate,
      [dailyJournalTemplate.id]: dailyJournalTemplate,
    },
    pageVersions: {}, // no history until the user explicitly saves a checkpoint
  };
}

/** Defensive against older schemas that predate a table — used for both a
 * corrupt/partial current record and a migrated legacy one. */
function normalizeDb(parsed: Partial<MockDb>): MockDb {
  if (!parsed.workspaces) parsed.workspaces = {};
  if (!parsed.pages) parsed.pages = {};
  if (!parsed.blocks) parsed.blocks = {};
  if (!parsed.links) parsed.links = {};
  if (!parsed.tags) parsed.tags = {};
  if (!parsed.pageTags) parsed.pageTags = {};
  if (!parsed.pageProperties) parsed.pageProperties = {};
  if (!parsed.templates) parsed.templates = {};
  if (!parsed.pageVersions) parsed.pageVersions = {};
  return parsed as MockDb;
}

// The database lives in memory for the duration of a session — every
// mockDb.read()/write() call below is synchronous, exactly like the
// localStorage-backed version this replaced, so none of the api/*.ts
// modules that call them need to change. IndexedDB (inherently async) sits
// underneath purely as a persistence layer: initDb() hydrates this cache
// once at startup, and every write is queued off to IndexedDB in the
// background afterward.
let cachedDb: MockDb | null = null;

// Persists writes strictly in the order they happened. Without this, two
// writes fired close together could race and let the older one "win" on
// disk even though the newer one already won in memory.
let persistQueue: Promise<void> = Promise.resolve();

function schedulePersist(db: MockDb): void {
  if (typeof indexedDB === "undefined") return; // e.g. some private-browsing modes — degrade to in-memory-only for this session
  persistQueue = persistQueue
    .then(() => idbSet(IDB_KEY, db))
    .catch(() => {
      // A failed persist shouldn't crash the app — the in-memory copy (already
      // applied by writeDb before this queue runs) is still correct for the
      // rest of the session; only durability across a reload is at risk.
    });
}

function readDb(): MockDb {
  // First call of the session, before initDb() has resolved (or in a test,
  // which never calls it): seed in memory so the app has *something* to
  // read immediately. initDb() overwrites this with real persisted data,
  // if any exists, before the app renders.
  if (!cachedDb) cachedDb = seedDb();
  return cachedDb;
}

function writeDb(db: MockDb): void {
  cachedDb = db;
  schedulePersist(db);
}

/** Simulated network latency so loading states are exercised honestly. */
export function networkDelay(ms = 220): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Hydrates the in-memory cache from IndexedDB. Call once, before the app
 * renders (see main.tsx) — every mockDb.read()/write() call before this
 * resolves would otherwise see a fresh seed instead of real persisted data.
 */
export async function initDb(): Promise<void> {
  if (typeof indexedDB === "undefined") {
    cachedDb ??= seedDb();
    return;
  }
  try {
    const stored = await idbGet<Partial<MockDb>>(IDB_KEY);
    if (stored) {
      cachedDb = normalizeDb(stored);
      return;
    }

    // Nothing in IndexedDB yet — check for data from before this migration.
    const legacyRaw = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY);
    if (legacyRaw) {
      const migrated = normalizeDb(JSON.parse(legacyRaw) as Partial<MockDb>);
      cachedDb = migrated;
      await idbSet(IDB_KEY, migrated);
      localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY);
      return;
    }

    // First run ever: seed demo content and persist it.
    cachedDb = seedDb();
    await idbSet(IDB_KEY, cachedDb);
  } catch (err) {
    console.error("Loom: failed to initialize IndexedDB, continuing in-memory only.", err);
    cachedDb ??= seedDb();
  }
}

export const mockDb = {
  read: readDb,
  write: writeDb,
  /** Overwrites everything with a fresh copy of the built-in demo content —
   * an easy way back to a known-good state (e.g. after testing import with
   * an unusual file) without needing to clear browser storage by hand. */
  resetToDemo: () => writeDb(seedDb()),
  /** Test-only: resets the in-memory cache to a fresh seed, bypassing
   * IndexedDB entirely, so each test starts from a known, isolated state. */
  resetForTests: () => {
    cachedDb = seedDb();
  },
};
