import type { ActionCode } from "../actions";
import type { SeverityBand } from "../severity";
import type { Iso8601, ProjectId, TaskId, UserId, UrlString } from "../primitives";
import type { Mode } from "../modes";

export const TASK_STATUS = ["todo", "inProgress", "inReview", "done", "wontFix"] as const;
export type TaskStatus = (typeof TASK_STATUS)[number];

export const TASK_PRIORITY = ["critical", "high", "medium", "low"] as const;
export type TaskPriority = (typeof TASK_PRIORITY)[number];

export const TASK_SOURCE = ["crawler", "manual", "ai", "keyword", "backlink", "agent"] as const;
export type TaskSource = (typeof TASK_SOURCE)[number];

export interface Task {
	id: TaskId;
	projectId: ProjectId;
	actionCode: ActionCode;
	mode: Mode;
	title: string;
	description?: string;
	status: TaskStatus;
	priority: TaskPriority;
	severity: SeverityBand;
	source: TaskSource;
	assigneeId?: UserId;
	pageUrls: ReadonlyArray<UrlString>;
	estimatedMinutes?: number;
	createdAt: Iso8601;
	updatedAt: Iso8601;
	completedAt?: Iso8601;
}
