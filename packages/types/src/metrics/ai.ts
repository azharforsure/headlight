import type { MetricDescriptor } from "./descriptor";

export const AI_METRIC_IDS = [
	"ai.overview.appearances",
	"ai.overview.citationRate",
	"ai.assistant.chatgpt.citations",
	"ai.assistant.perplexity.citations",
	"ai.assistant.gemini.citations",
	"ai.assistant.claude.citations",
	"ai.content.chunkability.score",
	"ai.content.answerability.score",
	"ai.content.entityCoverage.score",
	"ai.crawlers.allowed",
	"ai.crawlers.blocked",
	"ai.trainingOptOut.status",
	"ai.sitemap.llmsTxt.present",
] as const;

export type AiMetricId = (typeof AI_METRIC_IDS)[number];
export type AiMetricDescriptor = MetricDescriptor & { namespace: "ai"; id: AiMetricId };
