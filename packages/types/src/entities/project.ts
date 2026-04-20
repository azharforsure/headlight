import type { BusinessId, Iso8601, ProjectId, UrlString } from "../primitives";
import type { Industry } from "../industries";
import type { Mode } from "../modes";
import type { Locale } from "../i18n";

export interface Project {
	id: ProjectId;
	businessId: BusinessId;
	name: string;
	domain: UrlString;
	industry: Industry;
	defaultMode: Mode;
	defaultLocale: Locale;
	competitors: ReadonlyArray<UrlString>;
	markets: ReadonlyArray<Locale>;
	timezone: string;
	createdAt: Iso8601;
	updatedAt: Iso8601;
	archivedAt?: Iso8601;
}
