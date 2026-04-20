import type { Mode } from "./modes";
import type { SeverityBand } from "./severity";

// 48-action catalog. Prefixes: C=content, T=technical, L=links,
// S=structured data, A=analytics, P=performance, U=ux, SO=social, E=commerce, LO=local.
export const ACTION_CODES = [
	// Content (17)
	"C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08", "C09",
	"C10", "C11", "C12", "C13", "C14", "C15", "C16", "C17",
	// Technical (16)
	"T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08",
	"T09", "T10", "T11", "T12", "T13", "T14", "T15", "T16",
	// Links (7)
	"L01", "L02", "L03", "L04", "L05", "L06", "L07",
	// Structured data (6)
	"S01", "S02", "S03", "S04", "S05", "S06",
	// Analytics (5)
	"A01", "A02", "A03", "A04", "A05",
	// Performance (8)
	"P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08",
	// UX (5)
	"U01", "U02", "U03", "U04", "U05",
	// Social (4)
	"SO01", "SO02", "SO03", "SO04",
	// E-commerce (4)
	"E01", "E02", "E03", "E04",
	// Local (4)
	"LO01", "LO02", "LO03", "LO04",
] as const;

export type ActionCode = (typeof ACTION_CODES)[number];

export interface ActionDescriptor {
	code: ActionCode;
	title: string;
	description: string;
	modes: ReadonlyArray<Mode>;
	severity: SeverityBand;
	effortMinutes: number; // median implementation time
	impactHint: "high" | "medium" | "low";
	requires: ReadonlyArray<string>; // capability tags, e.g. "cms.wordpress"
}

export type ActionCatalog = Readonly<Record<ActionCode, ActionDescriptor>>;
