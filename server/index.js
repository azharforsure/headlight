import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { request as undiciRequest } from 'undici';
import { runCrawler } from './crawler.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@libsql/client';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const debugLogPath = path.resolve(__dirname, 'debug.log');

function debugLog(message) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}\n`;
    console.log(entry.trim());
    try {
        fs.appendFileSync(debugLogPath, entry);
    } catch (err) {
        console.error('Failed to write to debug.log:', err);
    }
}
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
app.use(cors());
app.use(express.json());

const turso = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

// Initialize google_tokens table
try {
    // Check if table exists and has all columns
    await turso.execute(`
        CREATE TABLE IF NOT EXISTS google_tokens (
            email TEXT PRIMARY KEY,
            access_token TEXT NOT NULL,
            refresh_token TEXT,
            expiry_date INTEGER,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Safely ensure expiry_date column exists (in case table was created by older version)
    try {
        await turso.execute("ALTER TABLE google_tokens ADD COLUMN expiry_date INTEGER");
        debugLog('Turso: Added missing expiry_date column to google_tokens');
    } catch (e) {
        // Ignored if column already exists
    }

    console.log('Turso: google_tokens table ready');
} catch (err) {
    console.error('Turso init error:', err);
}

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => console.log(`Crawler backend running on port ${PORT}`));

app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});

app.get('/api/debug/logs', (_req, res) => {
    try {
        if (!fs.existsSync(debugLogPath)) return res.send('No logs yet.');
        const content = fs.readFileSync(debugLogPath, 'utf8');
        res.header('Content-Type', 'text/plain');
        res.send(content);
    } catch (err) {
        res.status(500).send(`Failed to read logs: ${err.message}`);
    }
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

// ─── Google OAuth Code Exchange (Server-Owned Tokens) ─────────────────────
app.post('/api/integrations/google/exchange', async (req, res) => {
    debugLog('--- Starting Google Exchange ---');
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET;
    const { code, redirectUri } = req.body || {};

    if (!clientId || !clientSecret) {
        debugLog('ERROR: Google OAuth not configured (missing keys)');
        return res.status(500).json({ error: 'Google OAuth not configured on server.' });
    }
    if (!code || !redirectUri) {
        debugLog('ERROR: Missing code or redirectUri');
        return res.status(400).json({ error: 'code and redirectUri are required.' });
    }

    debugLog(`Code exchange with redirectUri: ${redirectUri}`);
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
        debugLog(`Token exchange status: ${response.statusCode}`);
        
        if (response.statusCode !== 200) {
            debugLog(`ERROR: Google exchange failed: ${JSON.stringify(payload)}`);
            return res.status(response.statusCode).json({ error: 'Google exchange failed', details: payload });
        }

        debugLog('Fetching user info (email)...');
        // Get user info (email)
        const userRes = await undiciRequest('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${payload.access_token}` }
        });
        
        const userData = await userRes.body.json();
        const email = userData.email;
        debugLog(`User email resolved: ${email || 'None'}`);

        if (!email) {
            debugLog('ERROR: Could not retrieve email from Google');
            return res.status(400).json({ error: 'Could not retrieve email from Google.' });
        }

        // Store tokens securely on server
        const expiryDate = Date.now() + (payload.expires_in * 1000);
        debugLog(`Storing tokens in Turso for: ${email}`);
        
        await turso.execute({
            sql: `INSERT OR REPLACE INTO google_tokens (email, access_token, refresh_token, expiry_date, updated_at) 
                  VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            args: [email, payload.access_token, payload.refresh_token || null, expiryDate]
        });

        debugLog('Google exchange successful');
        // Return only email and expiry to client (No tokens!)
        return res.json({ email, expiryDate });
    } catch (error) {
        debugLog(`CRITICAL ERROR during exchange: ${error.message}`);
        console.error('Exchange failed:', error);
        return res.status(500).json({ error: 'Internal server error during exchange.', details: error.message });
    }
});

// ─── Google OAuth Token Status ─────────────────────
app.get('/api/integrations/google/status', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
        const result = await turso.execute({
            sql: 'SELECT email, expiry_date FROM google_tokens WHERE email = ?',
            args: [email]
        });

        if (result.rows.length === 0) {
            return res.json({ connected: false });
        }

        const row = result.rows[0];
        return res.json({
            connected: true,
            email: row.email,
            expired: Date.now() > row.expiry_date
        });
    } catch (err) {
        return res.status(500).json({ error: 'Database error' });
    }
});

// ─── Google OAuth Token Refresh (Internal/Server-Side) ─────────────────────
app.post('/api/integrations/google/refresh', async (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET;
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
        const result = await turso.execute({
            sql: 'SELECT refresh_token FROM google_tokens WHERE email = ?',
            args: [email]
        });

        if (result.rows.length === 0 || !result.rows[0].refresh_token) {
            return res.status(401).json({ error: 'No refresh token available' });
        }

        const refreshToken = result.rows[0].refresh_token;

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
        if (response.statusCode === 200) {
            const expiryDate = Date.now() + (data.expires_in * 1000);
            await turso.execute({
                sql: 'UPDATE google_tokens SET access_token = ?, expiry_date = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
                args: [data.access_token, expiryDate, email]
            });
            return res.json({ access_token: data.access_token, expiryDate });
        }

        return res.status(401).json({ error: 'Refresh failed' });
    } catch (err) {
        return res.status(500).json({ error: 'Refresh exception' });
    }
});

// ─── Google OAuth Revoke ─────────────────────
app.post('/api/integrations/google/revoke', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
        await turso.execute({
            sql: 'DELETE FROM google_tokens WHERE email = ?',
            args: [email]
        });
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Database error' });
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

                // Handle both direct and payload-wrapped formats
                const payload = data.payload || data;
                const sessionId = payload.sessionId;
                const existingSession = sessionId ? activeSessions.get(sessionId) : null;
                const initialState = existingSession?.state || null;
                const rawConfig = payload.config || {};
                const googleConfig = rawConfig.google || {};
                const bingConfig = rawConfig.bing || {};

                const googleAccountEmail = googleConfig.email || googleConfig.accountLabel || null;

                // Resolve server-managed tokens before runCrawler.
                if (googleAccountEmail && !googleConfig.accessToken) {
                    try {
                        const tokenRes = await turso.execute({
                            sql: 'SELECT access_token, refresh_token, expiry_date FROM google_tokens WHERE email = ?',
                            args: [googleAccountEmail]
                        });
                        if (tokenRes.rows.length > 0) {
                            const row = tokenRes.rows[0];
                            googleConfig.accessToken = String(row.access_token);
                            googleConfig.refreshToken = String(row.refresh_token || '');
                            googleConfig.expiryDate = Number(row.expiry_date || 0);
                            googleConfig.email = googleAccountEmail;
                            console.log(`Resolved server-side tokens for ${googleAccountEmail}`);
                        }
                    } catch (err) {
                        console.error('Failed to resolve server-side tokens:', err);
                    }
                }

                const normalizedConfig = {
                    ...rawConfig,
                    gscApiKey: rawConfig.gscApiKey || googleConfig.accessToken || '',
                    gscRefreshToken: rawConfig.gscRefreshToken || googleConfig.refreshToken || '',
                    gscSiteUrl: rawConfig.gscSiteUrl || googleConfig.gscSiteUrl || googleConfig.selection?.siteUrl || '',
                    ga4AccessToken: rawConfig.ga4AccessToken || googleConfig.accessToken || '',
                    ga4PropertyId: rawConfig.ga4PropertyId || googleConfig.ga4PropertyId || googleConfig.selection?.propertyId || '',
                    bingAccessToken: rawConfig.bingAccessToken || bingConfig.accessToken || ''
                };

                crawlerInstance = runCrawler(normalizedConfig, async (event, payload) => {
                    // ── NEW: Handle Token Refreshed from crawler ──
                    if (event === 'TOKEN_REFRESHED' && payload.provider === 'google' && googleAccountEmail) {
                        try {
                            const newExpiry = Date.now() + (3600 * 1000); // Assume 1hr if not specified
                            await turso.execute({
                                sql: 'UPDATE google_tokens SET access_token = ?, expiry_date = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
                                args: [payload.accessToken, newExpiry, googleAccountEmail]
                            });
                            console.log(`Updated server-side token in Turso for ${googleAccountEmail}`);
                        } catch (err) {
                            console.error('Failed to update Turso token from crawler event:', err);
                        }
                    }

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
