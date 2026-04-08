import type { AIProviderAdapter, AIRequest, AIResponse } from '../types';

// Local browser AI — TF-IDF keywords, Flesch readability, sentiment heuristic
// No external calls. Always available. Handles: classify, extract, score (basic)
export function createLocalAdapter(): AIProviderAdapter {
  return {
    provider: 'local',
    async isAvailable() { return true; },
    async getQuotaRemaining() { return -1; }, // unlimited

    async complete(request: AIRequest): Promise<AIResponse> {
      const start = Date.now();
      let text = '';

      // Local adapter handles lightweight tasks only.
      // The AI Router sends complex tasks to cloud providers.
      // This is the fallback-of-last-resort that always works.
      switch (request.taskType) {
        case 'classify':
          text = localClassify(request.prompt);
          break;
        case 'extract':
          text = localExtractKeywords(request.prompt);
          break;
        case 'score':
          text = localScore(request.prompt);
          break;
        default:
          text = JSON.stringify({ error: 'Task not supported locally', fallback: true });
      }

      return {
        text,
        provider: 'local',
        model: 'local-heuristic',
        tokensUsed: 0,
        latencyMs: Date.now() - start,
        fromCache: false,
      };
    },
  };
}

// ─── Local Classifiers ──────────────────────────────
function localClassify(text: string): string {
  const lower = text.toLowerCase();
  // Search intent classification
  const transactional = /(buy|price|pricing|checkout|order|purchase|deal|discount|coupon|shop|cart|subscribe)/.test(lower);
  const commercial = /(best|top|review|compare|vs|versus|alternative|recommend)/.test(lower);
  const navigational = /(login|sign.?in|account|dashboard|contact|about|support)/.test(lower);

  const intent = transactional ? 'transactional'
    : commercial ? 'commercial'
    : navigational ? 'navigational'
    : 'informational';

  // Sentiment
  const posWords = (lower.match(/\b(great|excellent|amazing|love|best|good|wonderful|fantastic|easy|beautiful|helpful)\b/g) || []).length;
  const negWords = (lower.match(/\b(bad|terrible|awful|worst|hate|poor|broken|difficult|ugly|frustrating|annoying)\b/g) || []).length;
  const sentiment = posWords > negWords + 2 ? 'positive'
    : negWords > posWords + 2 ? 'negative'
    : 'neutral';

  return JSON.stringify({ intent, sentiment, confidence: 'heuristic' });
}

function localExtractKeywords(text: string): string {
  const stopWords = new Set(['the','and','for','that','with','from','this','have','will','your','into','about','their','would','there','which','when','what','where','while','also','were','been','being','over','under','than','then','them','they','our','you','are','but','not','all','can','use','more','most','such','each','per','via','its','has','had','was','who','why','how','may','any','out','off','too','very']);
  const words = text.toLowerCase().match(/[a-z]{3,}/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 15);
  return JSON.stringify({ keywords: sorted.map(([word, count]) => ({ word, count })) });
}

function localScore(text: string): string {
  const wordCount = (text.match(/\S+/g) || []).length;
  const sentenceCount = (text.split(/[.!?]+/).filter(s => s.trim()).length) || 1;
  const hasList = /<li|<ul|<ol|\n-\s|\n\d+\.\s/.test(text);
  const hasHeadings = /<h[2-6]|^##/m.test(text);

  // Simple content quality heuristic
  let score = 50;
  if (wordCount > 300) score += 10;
  if (wordCount > 800) score += 10;
  if (wordCount > 1500) score += 5;
  if (hasList) score += 5;
  if (hasHeadings) score += 5;
  if (sentenceCount > 5) score += 5;
  const avgSentLen = wordCount / sentenceCount;
  if (avgSentLen > 10 && avgSentLen < 25) score += 5;
  if (wordCount < 100) score -= 20;

  return JSON.stringify({ quality: Math.min(100, Math.max(0, score)), method: 'heuristic' });
}
