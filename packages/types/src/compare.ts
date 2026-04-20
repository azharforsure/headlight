export const COMPARE_DIMS = [
	"self.period", // this week vs last week
	"self.segment", // mobile vs desktop
	"self.market", // US vs UK
	"vs.competitor",
	"vs.benchmark", // industry median
	"vs.target", // user-set goal
] as const;
export type CompareDim = (typeof COMPARE_DIMS)[number];

export interface Delta {
	absolute: number;
	relative: number; // -1..+∞
	direction: "up" | "down" | "flat";
	isGood: boolean;
}

export interface CompareBand {
	dim: CompareDim;
	baseline: number;
	value: number;
	delta: Delta;
}
