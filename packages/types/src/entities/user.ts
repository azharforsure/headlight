import type { Iso8601, UserId, WorkspaceId } from "../primitives";

export type UserRole = "owner" | "admin" | "editor" | "viewer" | "guest";

export interface User {
	id: UserId;
	email: string;
	name: string;
	avatarUrl?: string;
	locale?: string;
	timezone?: string;
	createdAt: Iso8601;
}

export interface WorkspaceMembership {
	userId: UserId;
	workspaceId: WorkspaceId;
	role: UserRole;
	joinedAt: Iso8601;
}
