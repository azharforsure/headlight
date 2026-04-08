import type { AIProviderAdapter, AIRequest, AIResponse } from '../types';

// Google Gemini — free tier: 15 RPM, 1M tokens/day
export function createGeminiAdapter(apiKey: string): AIProviderAdapter {
  const model = 'gemini-1.5-flash';
  const BASE = `https://generativelanguage.googleapis.com/v1beta/models/${model}`;

  return {
    provider: 'gemini',
    async isAvailable() { return Boolean(apiKey); },
    async getQuotaRemaining() { return -1; },

    async complete(request: AIRequest): Promise<AIResponse> {
      const start = Date.now();

      const systemParts = request.systemPrompt
        ? [{ text: request.systemPrompt }]
        : [];

      const body: Record<string, unknown> = {
        contents: [
          ...(systemParts.length
            ? [{ role: 'model', parts: systemParts }]
            : []),
          { role: 'user', parts: [{ text: request.prompt }] },
        ],
        generationConfig: {
          maxOutputTokens: request.maxTokens || 512,
          temperature: request.temperature ?? 0.3,
          ...(request.format === 'json'
            ? { responseMimeType: 'application/json' }
            : {}),
        },
      };

      const res = await fetch(`${BASE}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Gemini error ${res.status}`);

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        text,
        provider: 'gemini',
        model,
        tokensUsed: data.usageMetadata?.totalTokenCount || text.length / 4,
        latencyMs: Date.now() - start,
        fromCache: false,
      };
    },
  };
}
