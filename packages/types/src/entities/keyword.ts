import type { Iso8601, KeywordId, ProjectId, UrlString } from "../primitives";
import type { Locale } from "../i18n";

export type KeywordIntent = "informational" | "navigational" | "commercial" | "transactional";

export interface Keyword {
	id: KeywordId;
	projectId: ProjectId;
	phrase: string;
	locale: Locale;
	device: "desktop" | "mobile";
	volume?: number;
	difficulty?: number;
	cpc?: number;
	intent: KeywordIntent;
	parentTopic?: string;
	rankingUrl?: UrlString;
	currentPosition?: number;
	previousPosition?: number;
	bestPosition?: number;
	tracked: boolean;
	createdAt: Iso8601;
	updatedAt: Iso8601;
}
