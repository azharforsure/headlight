// Metric roles — how a metric participates in views and ranking.
// G goal  I input  R result  L leading  H health
// B baseline  V velocity  X explainer
// K key  A actionable  S segment  T target  E exception
export const METRIC_ROLES = ["G", "I", "R", "L", "H", "B", "V", "X", "K", "A", "S", "T", "E"] as const;
export type MetricRole = (typeof METRIC_ROLES)[number];

export const METRIC_ROLE_LABEL: Record<MetricRole, string> = {
	G: "Goal",
	I: "Input",
	R: "Result",
	L: "Leading",
	H: "Health",
	B: "Baseline",
	V: "Velocity",
	X: "Explainer",
	K: "Key",
	A: "Actionable",
	S: "Segment",
	T: "Target",
	E: "Exception",
};
