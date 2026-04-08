import type { AIProviderAdapter, AIRequest, AIResponse } from '../types';

// Cloudflare Workers AI — called via your existing CF Worker proxy
export function createCloudflareAdapter(accountId: string, apiToken: string): AIProviderAdapter {
  const BASE = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run`;

  const MODEL_MAP: Record<string, string> = {
    classify: '@cf/meta/llama-3.1-8b-instruct',
    summarize: '@cf/meta/llama-3.1-8b-instruct',
    extract: '@cf/meta/llama-3.1-8b-instruct',
    generate: '@cf/meta/llama-3.1-8b-instruct',
    score: '@cf/meta/llama-3.1-8b-instruct',
    embed: '@cf/baai/bge-base-en-v1.5',
  };

  return {
    provider: 'cloudflare',

    async isAvailable() {
      return Boolean(accountId && apiToken);
    },

    async getQuotaRemaining() {
      return -1; // Track externally via AIQuotaState
    },

    async complete(request: AIRequest): Promise<AIResponse> {
      const model = MODEL_MAP[request.taskType] || MODEL_MAP.classify;
      const isEmbed = request.taskType === 'embed';
      const start = Date.now();

      const body = isEmbed
        ? { text: [request.prompt] }
        : {
            messages: [
              ...(request.systemPrompt
                ? [{ role: 'system', content: request.systemPrompt }]
                : []),
              { role: 'user', content: request.prompt },
            ],
            max_tokens: request.maxTokens || 512,
            temperature: request.temperature ?? 0.3,
          };

      const res = await fetch(`${BASE}/${model}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.errors?.[0]?.message || 'Cloudflare AI request failed');
      }

      const text = isEmbed
        ? JSON.stringify(data.result.data)
        : data.result.response || '';

      return {
        text,
        provider: 'cloudflare',
        model,
        tokensUsed: text.length / 4, // estimate
        latencyMs: Date.now() - start,
        fromCache: false,
      };
    },
  };
}
