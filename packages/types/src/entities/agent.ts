import type { AgentId, Iso8601, WorkspaceId } from "../primitives";
import type { Mode } from "../modes";

export type AgentKind =
	| "seoStrategist"
	| "contentEditor"
	| "technicalAuditor"
	| "linkProspector"
	| "competitorAnalyst"
	| "localSpecialist"
	| "paidOptimizer"
	| "commerceSpecialist"
	| "socialManager"
	| "answerEngineSpecialist"
	| "custom";

export interface Agent {
	id: AgentId;
	workspaceId: WorkspaceId;
	kind: AgentKind;
	name: string;
	mode: Mode;
	model: string;
	instructions: string;
	toolIds: ReadonlyArray<string>;
	enabled: boolean;
	createdAt: Iso8601;
	updatedAt: Iso8601;
}
