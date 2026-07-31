import type { Link, Page } from "./entities";

/** A page referencing the current page — derived from Link, not stored. */
export interface Backlink {
  link: Link;
  sourcePage: Pick<Page, "id" | "title" | "icon">;
}

export interface GraphNode {
  id: Page["id"];
  title: string;
  /** Number of links touching this page, used to size the node. */
  weight: number;
}

export interface GraphEdge {
  id: Link["id"];
  source: Page["id"];
  target: Page["id"];
}
