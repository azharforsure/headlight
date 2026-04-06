const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/userinfo.email', // Reduced to minimum
].join(' ');

/**
 * Metadata-Only Google OAuth Helper
 * 
 * Tokens are stored securely on the crawler server. The client
 * only holds the user's email as a reference key.
 */

export interface GoogleConnectionStatus {
    connected: boolean;
    email?: string;
    expired?: boolean;
}

/**
 * Check if a specific email is connected on the server
 */
export async function getGoogleTokenStatus(email: string): Promise<GoogleConnectionStatus> {
    try {
        const res = await fetch(`/api/integrations/google/status?email=${encodeURIComponent(email)}`);
        if (!res.ok) return { connected: false };
        return await res.json();
    } catch {
        return { connected: false };
    }
}

/**
 * Request a transient access token from the server
 */
export async function refreshGoogleToken(email: string): Promise<string | null> {
    try {
        const res = await fetch('/api/integrations/google/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.access_token;
    } catch {
        return null;
    }
}

/**
 * Revoke connection on the server
 */
export async function revokeGoogleConnection(email: string): Promise<boolean> {
    try {
        const res = await fetch('/api/integrations/google/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Opens a popup for Google OAuth consent.
 * Returns { code, redirectUri } on success, null on cancel.
 */
export function openGoogleOAuthPopup(): Promise<{ code: string; redirectUri: string } | null> {
  return new Promise((resolve) => {
    const redirectUri = `${window.location.origin}/oauth/google/callback`;
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    const width = 500;
    const height = 700;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    const popup = window.open(url, 'google_oauth', `width=${width},height=${height},left=${left},top=${top}`);

    if (!popup) {
      resolve(null);
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const currentOrigin = window.location.origin.replace(/\/$/, '');
      const eventOrigin = event.origin.replace(/\/$/, '');
      
      const isOriginMatch = eventOrigin === currentOrigin || 
        (currentOrigin.includes('localhost') && eventOrigin.includes('127.0.0.1')) ||
        (currentOrigin.includes('127.0.0.1') && eventOrigin.includes('localhost'));

      if (!isOriginMatch) return;

      if (event.data?.type === 'GOOGLE_OAUTH_CALLBACK' || event.data?.type === 'headlight-oauth-callback') {
        cleanup();
        
        if (event.data.error) {
          resolve(null);
          return;
        }

        if (event.data.code) {
          resolve({ code: event.data.code, redirectUri });
        } else {
          resolve(null);
        }
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'GOOGLE_OAUTH_RESULT') {
        try {
          const data = JSON.parse(event.newValue || '{}');
          if (data.type === 'GOOGLE_OAUTH_CALLBACK') {
            cleanup();
            if (data.code) {
              resolve({ code: data.code, redirectUri });
            } else {
              resolve(null);
            }
          }
        } catch (e) {
          console.error('[GoogleOAuthHelper] Failed to parse storage result', e);
        }
      }
    };

    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollTimer);
      localStorage.removeItem('GOOGLE_OAUTH_RESULT');
      try {
        if (popup && !popup.closed) popup.close();
      } catch (e) {
        // Access might be blocked by COOP - let the popup close itself if needed
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);

    const pollTimer = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          cleanup();
          resolve(null);
        }
      } catch (e) {
        // Access might be blocked by COOP
      }
    }, 1000);
  });
}

/**
 * Exchange auth code for server-side token storage.
 * Returns only the email and expiry (No tokens transferred to client permanently).
 */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<{ email: string; expiryDate: number } | null> {
  try {
    const res = await fetch('/api/integrations/google/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri }),
    });
    
    if (!res.ok) {
        const errorDetails = await res.json().catch(() => ({}));
        console.error('[GoogleOAuth] Exchange failed:', {
            status: res.status,
            statusText: res.statusText,
            details: errorDetails
        });
        return null;
    }
    return await res.json();
  } catch (error) {
    console.error('[GoogleOAuth] Exchange error:', error);
    return null;
  }
}
