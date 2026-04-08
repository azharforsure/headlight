import type { AIProviderAdapter, AIRequest, AIResponse } from '../types';

// GitHub Models — free via github.com/marketplace/models
export function createGitHubAdapter(githubToken: string): AIProviderAdapter {
  const BASE = 'https://models.inference.ai.azure.com';

  const MODEL_MAP: Record<string, string> = {
    classify: 'gpt-4o-mini',
    summarize: 'gpt-4o-mini',
    extract: 'gpt-4o-mini',
    generate: 'gpt-4o-mini',
    score: 'gpt-4o-mini',
    embed: 'text-embedding-3-small',
  };

  return {
    provider: 'github',

    async isAvailable() {
      return Boolean(githubToken);
    },

    async getQuotaRemaining() {
      return -1;
    },

    async complete(request: AIRequest): Promise<AIResponse> {
      const model = MODEL_MAP[request.taskType] || 'gpt-4o-mini';
      const isEmbed = request.taskType === 'embed';
      const start = Date.now();

      const endpoint = isEmbed ? '/embeddings' : '/chat/completions';

      const body = isEmbed
        ? { input: request.prompt, model }
        : {
            model,
            messages: [
              ...(request.systemPrompt
                ? [{ role: 'system', content: request.systemPrompt }]
                : []),
              { role: 'user', content: request.prompt },
            ],
            max_tokens: request.maxTokens || 512,
            temperature: request.temperature ?? 0.3,
            ...(request.format === 'json'
              ? { response_format: { type: 'json_object' } }
              : {}),
          };

      const res = await fetch(`${BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`GitHub Models error ${res.status}: ${err}`);
      }

      const data = await res.json();

      const text = isEmbed
        ? JSON.stringify(data.data?.[0]?.embedding)
        : data.choices?.[0]?.message?.content || '';

      return {
        text,
        provider: 'github',
        model,
        tokensUsed: data.usage?.total_tokens || text.length / 4,
        latencyMs: Date.now() - start,
        fromCache: false,
      };
    },
  };
}
