import type { Mode } from "./modes";

export const VIEW_KINDS = [
	"dashboard",
	"list",
	"table",
	"grid",
	"board",
	"graph",
	"map",
	"timeline",
	"inspector",
	"compare",
	"report",
	"settings",
] as const;
export type ViewKind = (typeof VIEW_KINDS)[number];

export const LAYOUT_DENSITY = ["compact", "cozy", "comfortable"] as const;
export type LayoutDensity = (typeof LAYOUT_DENSITY)[number];

export const PANEL_KINDS = [
	"pageDetail",
	"keywordDetail",
	"linkDetail",
	"competitorDetail",
	"issueDetail",
	"taskDetail",
	"runDetail",
	"contextHelp",
	"add",
	"settings",
] as const;
export type PanelKind = (typeof PANEL_KINDS)[number];

export interface ViewRef {
	mode: Mode;
	kind: ViewKind;
	id: string; // stable slug, e.g. "technical.crawlMap"
}
