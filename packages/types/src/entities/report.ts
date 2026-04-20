import type { Iso8601, ProjectId, ReportId, UserId } from "../primitives";
import type { Mode } from "../modes";

export type ReportKind = "modeSummary" | "fullAudit" | "executiveBrief" | "clientDeliverable" | "custom";
export type ReportFormat = "web" | "pdf" | "markdown" | "json";

export interface Report {
	id: ReportId;
	projectId: ProjectId;
	kind: ReportKind;
	mode: Mode;
	title: string;
	format: ReportFormat;
	coverPeriod: { start: Iso8601; end: Iso8601 };
	generatedBy: UserId | "agent" | "system";
	storageUrl?: string;
	createdAt: Iso8601;
}
