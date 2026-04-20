import type { Iso8601, ProjectId, RunId, UserId, AgentId } from "../primitives";
import type { Mode } from "../modes";
import type { CrawlConfig, CrawlProgress, CrawlStatus } from "../crawl";

export interface Run {
	id: RunId;
	projectId: ProjectId;
	mode: Mode;
	status: CrawlStatus;
	triggeredBy: UserId | AgentId | "schedule" | "system";
	config: CrawlConfig;
	progress: CrawlProgress;
	startedAt: Iso8601;
	finishedAt?: Iso8601;
	error?: string;
}
