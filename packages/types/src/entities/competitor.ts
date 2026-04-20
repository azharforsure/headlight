import type { CompetitorId, Iso8601, ProjectId, UrlString } from "../primitives";
import type { SiteFingerprint } from "../fingerprint";

export interface Competitor {
	id: CompetitorId;
	projectId: ProjectId;
	domain: UrlString;
	name?: string;
	tier: "primary" | "secondary" | "aspirational";
	fingerprint?: SiteFingerprint;
	sharedKeywords?: number;
	sharedBacklinks?: number;
	createdAt: Iso8601;
	updatedAt: Iso8601;
}
