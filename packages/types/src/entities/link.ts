import type { Iso8601, LinkId, ProjectId, UrlString } from "../primitives";

export type LinkKind = "internal" | "external.inbound" | "external.outbound";
export type LinkRel = "dofollow" | "nofollow" | "sponsored" | "ugc";

export interface Link {
	id: LinkId;
	projectId: ProjectId;
	kind: LinkKind;
	fromUrl: UrlString;
	toUrl: UrlString;
	anchor?: string;
	rel: LinkRel;
	httpStatus?: number;
	authority?: number;
	firstSeenAt: Iso8601;
	lastSeenAt: Iso8601;
	lostAt?: Iso8601;
}
