import type { AppUser } from './AuthContext';

interface CheckoutRequest {
  priceId: string;
  tierName: string;
  user: AppUser;
  token: string;
}

interface PortalRequest {
  stripeCustomerId?: string | null;
  user: AppUser;
  token: string;
}

interface BillingResponse {
  url: string;
}

const resolveWorkerBaseUrl = () => {
  const explicit = import.meta.env.VITE_APP_BRIDGE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const legacy = import.meta.env.VITE_GHOST_BRIDGE_URL;
  if (legacy) return legacy.replace(/\/$/, '');

  return '';
};

const workerBaseUrl = resolveWorkerBaseUrl();

const postBillingRoute = async <TBody extends Record<string, unknown>>(
  path: '/api/billing/checkout' | '/api/billing/portal',
  body: TBody,
  token: string
): Promise<BillingResponse> => {
  if (!workerBaseUrl) {
    throw new Error('Missing Worker URL. Set VITE_APP_BRIDGE_URL or VITE_GHOST_BRIDGE_URL.');
  }

  const response = await fetch(`${workerBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Billing request failed.');
  }

  if (!payload.url || typeof payload.url !== 'string') {
    throw new Error('Billing response did not include a redirect URL.');
  }

  return payload as BillingResponse;
};

export const startBillingCheckout = async ({ priceId, tierName, user, token }: CheckoutRequest) => {
  const successUrl = `${window.location.origin}/dashboard?billing=success`;
  const cancelUrl = `${window.location.origin}/pricing?billing=canceled`;

  return postBillingRoute('/api/billing/checkout', {
    priceId,
    tierName,
    clerkUserId: user.id,
    email: user.email,
    successUrl,
    cancelUrl
  }, token);
};

export const openBillingPortal = async ({ stripeCustomerId, user, token }: PortalRequest) => {
  const returnUrl = `${window.location.origin}/dashboard`;

  return postBillingRoute('/api/billing/portal', {
    stripeCustomerId,
    clerkUserId: user.id,
    email: user.email,
    returnUrl
  }, token);
};
