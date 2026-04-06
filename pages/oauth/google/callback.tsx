import React, { useEffect } from 'react';

export default function GoogleOAuthCallback() {
    useEffect(() => {
        // Extract 'code' from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        console.log('[GoogleOAuthCallback] Handled redirect query:', { code: !!code, error });

        // Send the code or error back to the opening window
        if (window.opener) {
            window.opener.postMessage(
                {
                    type: 'GOOGLE_OAUTH_CALLBACK',
                    code: code || null,
                    error: error || null,
                    provider: 'google'
                },
                '*' // Use wildcard to ensure delivery across local origins
            );
        } else {
            console.error('[GoogleOAuthCallback] No window.opener found. Popup was likely detached.');
        }
    }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6 font-sans">
      <div className="w-12 h-12 border-4 border-[#F5364E] border-t-transparent rounded-full animate-spin mb-6"></div>
      <h1 className="text-xl font-bold mb-2">Authorizing Google...</h1>
      <p className="text-sm text-[#888]">This window will close automatically once complete.</p>
    </div>
  );
}
