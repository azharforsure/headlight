export const JOB_KINDS = [
	"crawl.run",
	"crawl.enrich",
	"rankings.pull",
	"links.fetch",
	"ai.classify",
	"competitors.refresh",
	"report.generate",
	"notify.email",
	"agent.run",
] as const;
export type JobKind = (typeof JOB_KINDS)[number];

export const JOB_STATUS = [
	"pending",
	"claimed",
	"running",
	"succeeded",
	"failed",
	"retrying",
	"canceled",
] as const;
export type JobStatus = (typeof JOB_STATUS)[number];

export interface Job<P = unknown> {
	id: string;
	kind: JobKind;
	status: JobStatus;
	priority: number; // lower = more important
	payload: P;
	attempts: number;
	maxAttempts: number;
	scheduledFor: string; // ISO
	startedAt?: string;
	finishedAt?: string;
	error?: string;
}
