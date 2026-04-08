import type { AIRequest } from '../types';

// ─── Helper: truncate text to fit context window ─────
function truncate(text: string, maxChars: number = 3000): string {
  return text.length > maxChars ? text.slice(0, maxChars) + '...' : text;
}

// ─── t3-content-summary ─────────────────────────────
export function buildSummaryRequest(url: string, title: string, text: string): AIRequest {
  return {
    taskType: 'summarize',
    systemPrompt: 'You are an SEO analyst. Summarize web pages concisely.',
    prompt: `Summarize this web page in 2-3 sentences for an SEO audit report.\n\nURL: ${url}\nTitle: ${title}\nContent:\n${truncate(text, 2000)}`,
    maxTokens: 150,
    temperature: 0.3,
  };
}

// ─── t3-content-quality ─────────────────────────────
export function buildQualityScoreRequest(url: string, title: string, text: string, wordCount: number): AIRequest {
  return {
    taskType: 'score',
    systemPrompt: 'You are an SEO content quality assessor. Return JSON only.',
    prompt: `Score this page's content quality from 0-100 based on: depth, accuracy, structure, originality, and usefulness.

URL: ${url}
Title: ${title}
Word count: ${wordCount}
Content excerpt:
${truncate(text, 2500)}

Return JSON: {"quality": number, "strengths": [string], "weaknesses": [string], "suggestions": [string]}`,
    maxTokens: 300,
    temperature: 0.2,
    format: 'json',
  };
}

// ─── t3-content-intent ──────────────────────────────
export function buildIntentRequest(url: string, title: string, metaDesc: string, h1: string): AIRequest {
  return {
    taskType: 'classify',
    systemPrompt: 'Classify search intent. Return JSON only.',
    prompt: `Classify the search intent of this page.

URL: ${url}
Title: ${title}
Meta: ${metaDesc}
H1: ${h1}

Return JSON: {"intent": "informational"|"transactional"|"commercial"|"navigational", "confidence": number 0-1, "reasoning": string}`,
    maxTokens: 100,
    temperature: 0.1,
    format: 'json',
  };
}

// ─── t3-content-eeat ────────────────────────────────
export function buildEEATRequest(url: string, text: string, hasAuthor: boolean, hasAboutPage: boolean): AIRequest {
  return {
    taskType: 'score',
    systemPrompt: 'You are a Google E-E-A-T assessor. Return JSON only.',
    prompt: `Assess E-E-A-T signals for this page.

URL: ${url}
Has author byline: ${hasAuthor}
Has about page: ${hasAboutPage}
Content excerpt:
${truncate(text, 2000)}

Score each dimension 0-100:
Return JSON: {"experience": number, "expertise": number, "authoritativeness": number, "trustworthiness": number, "overall": number, "suggestions": [string]}`,
    maxTokens: 250,
    temperature: 0.2,
    format: 'json',
  };
}

// ─── t3-keyword-extract ─────────────────────────────
export function buildKeywordExtractionRequest(url: string, title: string, text: string): AIRequest {
  return {
    taskType: 'extract',
    systemPrompt: 'Extract SEO keywords. Return JSON only.',
    prompt: `Extract the top 10 SEO keywords/phrases from this page content. Include estimated search intent for each.

URL: ${url}
Title: ${title}
Content:
${truncate(text, 2500)}

Return JSON: {"keywords": [{"phrase": string, "intent": "informational"|"transactional"|"commercial"|"navigational", "relevance": number 0-1}]}`,
    maxTokens: 300,
    temperature: 0.2,
    format: 'json',
  };
}

// ─── t3-entity-extraction ───────────────────────────
export function buildEntityRequest(text: string): AIRequest {
  return {
    taskType: 'extract',
    systemPrompt: 'Extract named entities. Return JSON only.',
    prompt: `Extract named entities from this text. Categories: people, organizations, products, places, brands.

${truncate(text, 2500)}

Return JSON: {"entities": [{"name": string, "type": "person"|"organization"|"product"|"place"|"brand", "count": number}]}`,
    maxTokens: 300,
    temperature: 0.1,
    format: 'json',
  };
}

// ─── t3-topic-cluster ───────────────────────────────
export function buildTopicClusterRequest(url: string, title: string, text: string): AIRequest {
  return {
    taskType: 'classify',
    systemPrompt: 'Classify topic clusters. Return JSON only.',
    prompt: `What topic cluster does this page belong to? Identify the primary topic, subtopics, and suggest a cluster name.

URL: ${url}
Title: ${title}
Content excerpt:
${truncate(text, 1500)}

Return JSON: {"cluster": string, "primaryTopic": string, "subtopics": [string], "relatedClusters": [string]}`,
    maxTokens: 200,
    temperature: 0.2,
    format: 'json',
  };
}

// ─── t3-fix-suggestion ──────────────────────────────
export function buildFixSuggestionRequest(
  url: string, issueType: string, issueDetail: string, pageContext: string
): AIRequest {
  return {
    taskType: 'generate',
    systemPrompt: 'You are a senior SEO consultant. Generate specific, actionable fix suggestions.',
    prompt: `Generate a fix suggestion for this SEO issue.

URL: ${url}
Issue: ${issueType}
Detail: ${issueDetail}
Page context: ${truncate(pageContext, 1000)}

Provide: 1) What's wrong 2) How to fix it 3) Expected impact 4) Code snippet if applicable

Return JSON: {"fix": string, "impact": "high"|"medium"|"low", "effort": "low"|"medium"|"high", "code": string|null}`,
    maxTokens: 400,
    temperature: 0.3,
    format: 'json',
  };
}

// ─── t3-meta-rewrite ────────────────────────────────
export function buildMetaRewriteRequest(
  url: string, title: string, currentMeta: string, keywords: string[], text: string
): AIRequest {
  return {
    taskType: 'generate',
    systemPrompt: 'Write SEO-optimized meta descriptions. 120-155 characters. Include a call to action.',
    prompt: `Write an optimized meta description for this page.

URL: ${url}
Title: ${title}
Current meta: ${currentMeta || '[MISSING]'}
Target keywords: ${keywords.join(', ')}
Content excerpt: ${truncate(text, 1000)}

Return JSON: {"metaDescription": string, "characterCount": number, "keywordsIncluded": [string]}`,
    maxTokens: 150,
    temperature: 0.5,
    format: 'json',
  };
}

// ─── t3-crawl-narrative ─────────────────────────────
export function buildCrawlNarrativeRequest(stats: {
  total: number; healthy: number; errors: number;
  healthScore: number; grade: string;
  topIssues: string[]; domain: string;
}): AIRequest {
  return {
    taskType: 'summarize',
    systemPrompt: 'You are an SEO analyst writing an executive summary for a client.',
    prompt: `Write a 3-4 sentence executive summary of this website crawl audit.

Domain: ${stats.domain}
Pages crawled: ${stats.total}
Healthy pages: ${stats.healthy} (${((stats.healthy / stats.total) * 100).toFixed(1)}%)
Error pages: ${stats.errors}
Health score: ${stats.healthScore}/100 (Grade: ${stats.grade})
Top issues: ${stats.topIssues.join(', ')}

Be specific about the biggest wins and estimated traffic impact.`,
    maxTokens: 250,
    temperature: 0.4,
  };
}

// ─── t3-alt-text-generation ─────────────────────────
export function buildAltTextRequest(imgSrc: string, pageUrl: string, pageTitle: string, surroundingText: string): AIRequest {
  return {
    taskType: 'generate',
    systemPrompt: 'Generate descriptive, SEO-friendly image alt text. 5-15 words. Be specific, not generic.',
    prompt: `Generate alt text for this image.

Image URL: ${imgSrc}
Page: ${pageUrl}
Page title: ${pageTitle}
Surrounding text: ${truncate(surroundingText, 300)}

Return JSON: {"altText": string, "wordCount": number}`,
    maxTokens: 60,
    temperature: 0.3,
    format: 'json',
  };
}
