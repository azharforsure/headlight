import { CrawlerIntegrationProvider } from './CrawlerIntegrationsService';

type SecretRecord = Record<string, string>;

const secretVault = new Map<string, SecretRecord>();
const STORAGE_KEY = 'headlight:seo-crawler-secrets';
let hydrated = false;

const buildKey = (scope: string, provider: CrawlerIntegrationProvider) => `${scope}:${provider}`;
const isBrowser = () => typeof window !== 'undefined';

const hydrateVault = () => {
    if (hydrated || !isBrowser()) return;
    hydrated = true;

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw) as Record<string, SecretRecord>;
        Object.entries(parsed).forEach(([key, value]) => {
            if (value && typeof value === 'object') {
                secretVault.set(key, { ...value });
            }
        });
    } catch (error) {
        console.error('Failed to hydrate crawler secrets:', error);
    }
};

const persistVault = () => {
    if (!isBrowser()) return;

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(secretVault.entries())));
    } catch (error) {
        console.error('Failed to persist crawler secrets:', error);
    }
};

export const getCrawlerSecretScope = (projectId?: string | null) => projectId || 'anonymous';

export const storeCrawlerIntegrationSecret = (
    scope: string,
    provider: CrawlerIntegrationProvider,
    credentials?: Record<string, string>
) => {
    if (!credentials || Object.keys(credentials).length === 0) return;
    hydrateVault();
    secretVault.set(buildKey(scope, provider), { ...credentials });
    persistVault();
};

export const mergeCrawlerIntegrationSecret = (
    scope: string,
    provider: CrawlerIntegrationProvider,
    credentials?: Record<string, string>
) => {
    if (!credentials || Object.keys(credentials).length === 0) return;
    hydrateVault();
    const key = buildKey(scope, provider);
    secretVault.set(key, { ...(secretVault.get(key) || {}), ...credentials });
    persistVault();
};

export const getCrawlerIntegrationSecret = (
    scope: string,
    provider: CrawlerIntegrationProvider
): SecretRecord => {
    hydrateVault();
    return { ...(secretVault.get(buildKey(scope, provider)) || {}) };
};

export const clearCrawlerIntegrationSecret = (scope: string, provider: CrawlerIntegrationProvider) => {
    hydrateVault();
    secretVault.delete(buildKey(scope, provider));
    persistVault();
};

export const clearCrawlerIntegrationSecretsForScope = (scope: string) => {
    hydrateVault();
    for (const key of secretVault.keys()) {
        if (key.startsWith(`${scope}:`)) {
            secretVault.delete(key);
        }
    }
    persistVault();
};
