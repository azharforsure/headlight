import React, { useEffect } from 'react';

const GOOGLE_OAUTH_RESULT_KEY = 'GOOGLE_OAUTH_RESULT';

export default function GoogleOAuthCallback() {
    useEffect(() => {
        // Extract 'code' from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        console.log('[GoogleOAuthCallback] Handled redirect query:', { code: !!code, error });

        // 1. Fallback: Write to localStorage (Same Domain)
        const result = {
            type: 'GOOGLE_OAUTH_CALLBACK',
            code: code || null,
            error: error || null,
            provider: 'google',
            timestamp: Date.now()
        };
        localStorage.setItem(GOOGLE_OAUTH_RESULT_KEY, JSON.stringify(result));

        // 2. Primary: Send the code or error back to the opening window via postMessage
        if (window.opener) {
            console.log('[GoogleOAuthCallback] window.opener found, sending postMessage');
            window.opener.postMessage(result, window.location.origin);
        } else {
            console.warn('[GoogleOAuthCallback] No window.opener found. Relying on localStorage fallback.');
        }

        // 3. Self-close fallback (in case COOP blocks the opener from closing this window)
        setTimeout(() => {
            window.close();
        }, 3000);
    }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6 font-sans">
      <div className="w-12 h-12 border-4 border-[#F5364E] border-t-transparent rounded-full animate-spin mb-6"></div>
      <h1 className="text-xl font-bold mb-2">Authorizing Google...</h1>
      <p className="text-sm text-[#888]">This window will close automatically once complete.</p>
    </div>
  );
}
