import type { BusinessId, Iso8601, WorkspaceId } from "../primitives";
import type { Industry } from "../industries";

export interface Business {
	id: BusinessId;
	workspaceId: WorkspaceId;
	name: string;
	industry: Industry;
	description?: string;
	logoUrl?: string;
	createdAt: Iso8601;
	updatedAt: Iso8601;
}
