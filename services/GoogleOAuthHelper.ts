const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.edit',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

/**
 * Opens a popup for Google OAuth consent.
 * Returns { code, redirectUri } on success, null on cancel.
 */
export function openGoogleOAuthPopup(): Promise<{ code: string; redirectUri: string } | null> {
  return new Promise((resolve) => {
    const redirectUri = `${window.location.origin}/oauth/google/callback`;
    console.log('[GoogleOAuth] Initiating popup with redirectUri:', redirectUri);
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

    // Listen for the callback message from the popup
    const handleMessage = (event: MessageEvent) => {
      // Standardize origin check for development
      const currentOrigin = window.location.origin.replace(/\/$/, '');
      const eventOrigin = event.origin.replace(/\/$/, '');
      
      const isOriginMatch = eventOrigin === currentOrigin || 
        (currentOrigin.includes('localhost') && eventOrigin.includes('127.0.0.1')) ||
        (currentOrigin.includes('127.0.0.1') && eventOrigin.includes('localhost'));

      if (!isOriginMatch) {
         console.warn('[GoogleOAuth] Received message from unauthorized origin:', event.origin);
         return;
      }

      console.log('[GoogleOAuth] Received message from popup:', event.data);

      if (event.data?.type === 'GOOGLE_OAUTH_CALLBACK' || event.data?.type === 'headlight-oauth-callback') {
        window.removeEventListener('message', handleMessage);
        clearInterval(pollTimer);
        popup.close();

        if (event.data.error) {
          console.error('[GoogleOAuth] OAuth Error:', event.data.error);
          resolve(null);
          return;
        }

        if (event.data.code) {
          console.log('[GoogleOAuth] Successfully received auth code.');
          resolve({ code: event.data.code, redirectUri });
        } else {
          console.warn('[GoogleOAuth] No code in callback data.');
          resolve(null);
        }
      }
    };
    window.addEventListener('message', handleMessage);

    // Fallback: poll for popup close
    const pollTimer = setInterval(() => {
      try {
        if (popup.closed) {
          console.log('[GoogleOAuth] Popup was closed by the user.');
          clearInterval(pollTimer);
          window.removeEventListener('message', handleMessage);
          resolve(null);
        }
      } catch (e) {
        // COOP might block access to 'closed' property after Google redirect.
        // We just ignore the error and keep the timer running until the message arrives.
      }
    }, 1000);
  });
}

/**
 * Exchange auth code for tokens via your server.
 */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token: string;
  email?: string;
} | null> {
  try {
    console.log('[GoogleOAuth] Exchanging code with server...', { code: code.substring(0, 10) + '...', redirectUri });
    const res = await fetch('/api/integrations/google/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri }),
    });
    
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[GoogleOAuth] Server exchange failed:', res.status, errorData);
        return null;
    }
    
    const tokens = await res.json();
    console.log('[GoogleOAuth] Successfully received tokens from server.');
    return tokens;
  } catch (error) {
    console.error('[GoogleOAuth] Fetch error during exchange:', error);
    return null;
  }
}

/**
 * Fetch the user's Google email from the access token.
 */
export async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.email || null;
  } catch {
    return null;
  }
}
