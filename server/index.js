import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { request as undiciRequest } from 'undici';
import { runCrawler } from './crawler.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => console.log(`Crawler backend running on port ${PORT}`));

app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});

app.post('/api/integrations/bing/exchange', async (req, res) => {
    const clientId = process.env.BING_CLIENT_ID;
    const clientSecret = process.env.BING_CLIENT_SECRET;
    const { code, redirectUri } = req.body || {};

    if (!clientId || !clientSecret) {
        return res.status(500).json({
            error: 'Bing OAuth is not configured on the crawler server.',
            missing: [
                !clientId ? 'BING_CLIENT_ID' : null,
                !clientSecret ? 'BING_CLIENT_SECRET' : null
            ].filter(Boolean)
        });
    }

    if (!code || !redirectUri) {
        return res.status(400).json({
            error: 'Both `code` and `redirectUri` are required.'
        });
    }

    try {
        const body = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
        });

        const response = await undiciRequest('https://www.bing.com/webmasters/oauth/token', {
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: body.toString()
        });

        const payloadText = await response.body.text();
        let payload = {};

        try {
            payload = JSON.parse(payloadText);
        } catch {
            payload = { raw: payloadText };
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
            return res.status(response.statusCode).json({
                error: 'Bing token exchange failed.',
                details: payload
            });
        }

        return res.json(payload);
    } catch (error) {
        console.error('Bing token exchange failed:', error);
        return res.status(500).json({
            error: 'Bing token exchange failed unexpectedly.'
        });
    }
});

// ─── Google OAuth Code Exchange ─────────────────────
app.post('/api/integrations/google/exchange', async (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET;
    const { code, redirectUri } = req.body || {};

    if (!clientId || !clientSecret) {
        return res.status(500).json({
            error: 'Google OAuth is not configured on the server.',
            missing: [
                !clientId ? 'GOOGLE_CLIENT_ID' : null,
                !clientSecret ? 'GOOGLE_CLIENT_SECRET' : null
            ].filter(Boolean)
        });
    }

    if (!code || !redirectUri) {
        return res.status(400).json({ error: 'Both `code` and `redirectUri` are required.' });
    }

    try {
        const response = await undiciRequest('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri
            }).toString()
        });

        const payload = await response.body.json();

        if (response.statusCode < 200 || response.statusCode >= 300) {
            return res.status(response.statusCode).json({
                error: 'Google token exchange failed.',
                details: payload
            });
        }

        // Fetch user email
        let email = null;
        if (payload.access_token) {
            try {
                const userRes = await undiciRequest('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { 'Authorization': `Bearer ${payload.access_token}` }
                });
                if (userRes.statusCode === 200) {
                    const userData = await userRes.body.json();
                    email = userData.email || null;
                }
            } catch { /* non-fatal */ }
        }

        return res.json({
            access_token: payload.access_token,
            refresh_token: payload.refresh_token,
            expires_in: payload.expires_in,
            email
        });
    } catch (error) {
        console.error('Google token exchange failed:', error);
        return res.status(500).json({ error: 'Google token exchange failed unexpectedly.' });
    }
});

// ─── Google OAuth Token Refresh ─────────────────────
app.post('/api/integrations/google/refresh', async (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET;
    const { refreshToken } = req.body || {};

    if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'Google OAuth not configured on server.' });
    }
    if (!refreshToken) {
        return res.status(400).json({ error: 'refreshToken is required.' });
    }

    try {
        const response = await undiciRequest('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            }).toString()
        });

        const data = await response.body.json();
        if (response.statusCode === 200 && data.access_token) {
            return res.json({ access_token: data.access_token });
        }
        return res.status(401).json({ error: 'Token refresh failed', details: data });
    } catch (err) {
        return res.status(500).json({ error: 'Token refresh exception' });
    }
});

const wss = new WebSocketServer({ server });
const activeSessions = new Map(); // sessionId -> { state, config }

// ─── Session cleanup: remove stale sessions older than 24h ───
setInterval(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const [id, session] of activeSessions) {
        if (session.updatedAt < cutoff) {
            activeSessions.delete(id);
        }
    }
}, 60 * 60 * 1000); // Check every hour

wss.on('connection', (ws) => {
    let crawlerInstance = null;
    let sessionTimeout = null;

    // Per-session timeout: kill zombie crawls after 6 hours
    const SESSION_TIMEOUT = 6 * 60 * 60 * 1000;

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'START_CRAWL') {
                // Stop any existing crawler for this connection
                if (crawlerInstance) {
                    await crawlerInstance.stop();
                    crawlerInstance = null;
                }

                // Clear previous timeout
                if (sessionTimeout) {
                    clearTimeout(sessionTimeout);
                }

                const sessionId = data.sessionId;
                const existingSession = sessionId ? activeSessions.get(sessionId) : null;
                const initialState = existingSession?.state || null;
                const rawConfig = data.config || {};
                const googleConfig = rawConfig.google || {};
                const bingConfig = rawConfig.bing || {};
                const normalizedConfig = {
                    ...rawConfig,
                    gscApiKey: rawConfig.gscApiKey || googleConfig.accessToken || '',
                    gscRefreshToken: rawConfig.gscRefreshToken || googleConfig.refreshToken || '',
                    gscSiteUrl: rawConfig.gscSiteUrl || googleConfig.gscSiteUrl || '',
                    ga4AccessToken: rawConfig.ga4AccessToken || googleConfig.accessToken || '',
                    ga4PropertyId: rawConfig.ga4PropertyId || googleConfig.ga4PropertyId || '',
                    bingAccessToken: rawConfig.bingAccessToken || bingConfig.accessToken || ''
                };

                crawlerInstance = runCrawler(normalizedConfig, (event, payload) => {
                    // Save state on pause/stop
                    if (event === 'CRAWL_STOPPED' && sessionId) {
                        activeSessions.set(sessionId, {
                            state: payload.state,
                            config: normalizedConfig,
                            updatedAt: Date.now()
                        });
                    }

                    if (event === 'CRAWL_FINISHED' && sessionId) {
                        activeSessions.delete(sessionId);
                    }

                    // Send to client if connection is still open
                    if (ws.readyState === ws.OPEN) {
                        try {
                            ws.send(JSON.stringify({ type: event, payload }));
                        } catch {
                            // Connection dropped mid-send, ignore
                        }
                    }
                }, initialState);

                // Set session timeout
                sessionTimeout = setTimeout(async () => {
                    if (crawlerInstance) {
                        console.log(`Session timeout reached, stopping crawl for session ${sessionId}`);
                        await crawlerInstance.stop();
                        crawlerInstance = null;
                    }
                }, SESSION_TIMEOUT);

            } else if (data.type === 'STOP_CRAWL') {
                if (crawlerInstance) {
                    await crawlerInstance.stop();
                    crawlerInstance = null;
                }
                if (sessionTimeout) {
                    clearTimeout(sessionTimeout);
                    sessionTimeout = null;
                }
            }
        } catch (err) {
            console.error('WebSocket message error:', err);
            if (ws.readyState === ws.OPEN) {
                try {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        payload: { message: 'Server error processing your request.' }
                    }));
                } catch {}
            }
        }
    });

    ws.on('close', async () => {
        if (crawlerInstance) {
            await crawlerInstance.stop();
            crawlerInstance = null;
        }
        if (sessionTimeout) {
            clearTimeout(sessionTimeout);
            sessionTimeout = null;
        }
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err.message);
    });
});

// ─── Graceful Shutdown ──────────────────────────────────────
async function gracefulShutdown(signal) {
    console.log(`\n${signal} received. Closing connections...`);

    // Close all WebSocket connections
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            try {
                client.send(JSON.stringify({
                    type: 'ERROR',
                    payload: { message: 'Server is shutting down. Your scan progress has been saved.' }
                }));
            } catch {}
            client.close();
        }
    });

    wss.close(() => {
        server.close(() => {
            console.log('Server closed cleanly.');
            process.exit(0);
        });
    });

    // Force exit after 5 seconds if graceful shutdown hangs
    setTimeout(() => {
        console.log('Forced shutdown.');
        process.exit(1);
    }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch unhandled errors so the server doesn't crash
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
});
