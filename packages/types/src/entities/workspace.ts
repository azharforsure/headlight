import type { Iso8601, WorkspaceId, UserId } from "../primitives";

export type WorkspaceKind = "personal" | "team" | "agency";
export type WorkspacePlan = "free" | "pro" | "team" | "agency" | "enterprise";

export interface Workspace {
	id: WorkspaceId;
	name: string;
	slug: string;
	kind: WorkspaceKind;
	plan: WorkspacePlan;
	ownerId: UserId;
	createdAt: Iso8601;
	updatedAt: Iso8601;
	seatCount: number;
}
