import { AIRouter } from './AIRouter';
import { AIAnalysisEngine } from './AIAnalysisEngine';
import { createLocalAdapter } from './adapters/local';
import { createCloudflareAdapter } from './adapters/cloudflare';
import { createGitHubAdapter } from './adapters/github';
import { createGeminiAdapter } from './adapters/gemini';
import { createGroqAdapter } from './adapters/groq';
import { createHuggingFaceAdapter } from './adapters/huggingface';

export type { AIProvider, AITaskType, AIRequest, AIResponse } from './types';
export { AIRouter } from './AIRouter';
export { AIAnalysisEngine } from './AIAnalysisEngine';

// ─── Singleton factory ──────────────────────────────
let _router: AIRouter | null = null;
let _engine: AIAnalysisEngine | null = null;

export function getAIRouter(): AIRouter {
  if (!_router) {
    _router = new AIRouter();

    // Always register local (always available, zero cost)
    _router.registerAdapter(createLocalAdapter());

    // Register cloud providers from env/settings
    const cfAccountId = import.meta.env.VITE_CF_ACCOUNT_ID;
    const cfApiToken = import.meta.env.VITE_CF_AI_TOKEN;
    if (cfAccountId && cfApiToken) {
      _router.registerAdapter(createCloudflareAdapter(cfAccountId, cfApiToken));
    }

    const ghToken = import.meta.env.VITE_GITHUB_MODELS_TOKEN;
    if (ghToken) {
      _router.registerAdapter(createGitHubAdapter(ghToken));
    }

    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      _router.registerAdapter(createGeminiAdapter(geminiKey));
    }

    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    if (groqKey) {
      _router.registerAdapter(createGroqAdapter(groqKey));
    }

    const hfToken = import.meta.env.VITE_HF_TOKEN;
    if (hfToken) {
      _router.registerAdapter(createHuggingFaceAdapter(hfToken));
    }
  }
  return _router;
}

export function getAIEngine(): AIAnalysisEngine {
  if (!_engine) {
    _engine = new AIAnalysisEngine(getAIRouter());
  }
  return _engine;
}

// Allow runtime registration (from user settings UI)
export function registerUserProvider(
  provider: 'openai' | 'anthropic',
  apiKey: string
) {
  // For paid providers the user optionally connects
  const router = getAIRouter();
  if (provider === 'openai') {
    // Use OpenAI-compatible adapter (same shape as Groq)
    const adapter = createGroqAdapter(apiKey);
    // Override provider name
    (adapter as any).provider = 'openai';
    router.registerAdapter(adapter);
  }
  // Similar for anthropic with custom adapter could be added here
}
