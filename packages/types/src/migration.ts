// Bridge from the legacy root `types.ts` / `services/app-types.ts` to the new module.
// Delete once every consumer imports from "@headlight/types".

import type { Mode } from "./modes";
import type { TaskStatus, TaskPriority, TaskSource } from "./entities/task";

// Old: enum UserMode { VISITOR, SAAS_USER, AGENCY_CLIENT } — not a product mode.
// Rename to `AccountRole` and keep as a union. "AGENCY_CLIENT" becomes "agencyClient".
export type AccountRole = "visitor" | "saasUser" | "agencyClient";

export const ACCOUNT_ROLE_FROM_LEGACY: Record<string, AccountRole> = {
	VISITOR: "visitor",
	SAAS_USER: "saasUser",
	AGENCY_CLIENT: "agencyClient",
};

// Old `ViewType` mixed product modes with views. Split:
// - workspace-level views (dashboard, settings_*) stay as `ViewKind` values.
// - mode-like values (competitors, rank_tracker, site_audit, web_vitals, etc.) map to the new `Mode`.
export const LEGACY_VIEW_TO_MODE: Record<string, Mode | null> = {
	dashboard: null,
	content_predictor: "content",
	keyword_research: "content",
	competitors: "competitors",
	rank_tracker: "fullAudit",
	mentions: "socialBrand",
	site_audit: "technical",
	web_vitals: "uxConversion",
	agency_hub: null,
	automation: null,
	opportunities: "fullAudit",
	settings_project: null,
	settings_account: null,
};

// Old task enums had snake_case statuses; map to camelCase.
export const LEGACY_TASK_STATUS: Record<string, TaskStatus> = {
	todo: "todo",
	in_progress: "inProgress",
	in_review: "inReview",
	done: "done",
	wont_fix: "wontFix",
};
export const LEGACY_TASK_PRIORITY: Record<string, TaskPriority> = {
	critical: "critical",
	high: "high",
	medium: "medium",
	low: "low",
};
export const LEGACY_TASK_SOURCE: Record<string, TaskSource> = {
	crawler: "crawler",
	manual: "manual",
	ai_suggestion: "ai",
	keyword: "keyword",
	backlink: "backlink",
};
