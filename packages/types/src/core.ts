// packages/types/src/core.ts
import type { ActionCode, SeverityBand } from './actions';

export interface Page {
	url: string;
	title?: string;
	qualityScore?: number;
	category?: string;
	gscClicks?: number;
	gscImpr?: number;
	gscAvgPos?: number;
	clicksDelta?: number;
	lostFromTop50?: boolean;
	keywords?: Array<{
		keyword: string;
		position: number;
		clicks: number;
		impressions: number;
	}>;
	recommendedAction?: string;
	actions?: Array<{
		code: ActionCode;
		templateId?: string;
		title: string;
		priority: 'high' | 'medium' | 'low';
		type: 'content' | 'tech' | 'links' | 'merge' | 'deprecate';
		expectedScoreDelta?: number;
		expectedClicksMonthly?: number;
		confidence?: number;
		assignee?: string;
	}>;
	wordCount?: number;
	readability?: number;
	freshnessDays?: number;
	hasByline?: boolean;
	hasAuthorBio?: boolean;
	externalCitations?: number;
	updatedDateVisible?: boolean;
	schemaTypes?: string[];
	indexable?: boolean;
	metaNoindex?: boolean;
	blockedByRobots?: boolean;
	canonical?: string;
	statusCode?: number;
	renderMode?: 'static' | 'ssr' | 'csr';
	responseMs?: number;
	lcpMs?: number;
	inpMs?: number;
	cls?: number;
	template?: string;
	inLinks?: number;
	depth?: number;
	redirectChainLength?: number;
	hasMixedContent?: boolean;
	nearDuplicateGroup?: string | number;
	cannibalizedBy?: string;
	exactDuplicate?: boolean;
	// Add other fields as needed
	[key: string]: any;
}

export interface Session {
	id: string;
	startedAt: number;
	summary?: {
		qualityAvg?: number;
		search?: {
			clicks: number;
			impr: number;
			ctr: number;
			pos: number;
		};
		[key: string]: any;
	};
	[key: string]: any;
}

export interface Site {
	industry?: string;
	connectors?: Array<{
		id: string;
		state: string;
	}>;
	cohort?: {
		ctrCurve?: Record<number, number>;
		[key: string]: any;
	};
	[key: string]: any;
}
