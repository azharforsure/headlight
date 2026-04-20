import type { Iso8601, PageId, ProjectId, UrlString } from "../primitives";
import type { PageFingerprint } from "../fingerprint";

export type PageStatus = "ok" | "redirect" | "clientError" | "serverError" | "blocked" | "timeout" | "noindex" | "duplicate" | "thin";

export interface Page {
	id: PageId;
	projectId: ProjectId;
	url: UrlString;
	status: PageStatus;
	httpStatus: number;
	fingerprint: PageFingerprint;
	depth: number;
	inboundInternalCount: number;
	outboundInternalCount: number;
	outboundExternalCount: number;
	firstSeenAt: Iso8601;
	lastSeenAt: Iso8601;
}
