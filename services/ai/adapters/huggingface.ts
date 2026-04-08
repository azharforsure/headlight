import type { AIProviderAdapter, AIRequest, AIResponse } from '../types';

// HuggingFace Inference API — free rate-limited tier
export function createHuggingFaceAdapter(apiToken: string): AIProviderAdapter {
  return {
    provider: 'huggingface',
    async isAvailable() { return Boolean(apiToken); },
    async getQuotaRemaining() { return -1; },

    async complete(request: AIRequest): Promise<AIResponse> {
      const model = 'mistralai/Mistral-7B-Instruct-v0.3';
      const start = Date.now();

      const prompt = request.systemPrompt
        ? `<s>[INST] ${request.systemPrompt}\n\n${request.prompt} [/INST]`
        : `<s>[INST] ${request.prompt} [/INST]`;

      const res = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: request.maxTokens || 512,
              temperature: request.temperature ?? 0.3,
              return_full_text: false,
            },
          }),
        }
      );

      if (!res.ok) throw new Error(`HuggingFace error ${res.status}`);
      const data = await res.json();
      const text = Array.isArray(data)
        ? data[0]?.generated_text || ''
        : data.generated_text || '';

      return {
        text,
        provider: 'huggingface',
        model,
        tokensUsed: text.length / 4,
        latencyMs: Date.now() - start,
        fromCache: false,
      };
    },
  };
}
