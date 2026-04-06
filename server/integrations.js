import { request as undiciRequest } from 'undici';

/**
 * Service to fetch data from 3rd party SEO APIs
 */
export class IntegrationsService {
    /**
     * Refresh an OAuth2 access token using a refresh token
     */
    static async refreshAccessToken(refreshToken) {
        if (!refreshToken) return null;

        try {
            const response = await undiciRequest('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '',
                    client_secret: process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET || '',
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token'
                }).toString()
            });

            if (response.statusCode === 200) {
                const data = await response.body.json();
                return data.access_token;
            }
            const err = await response.body.json();
            console.error('[Integrations] Token refresh failed:', err);
            return null;
        } catch (error) {
            console.error('[Integrations] Token refresh exception:', error);
            return null;
        }
    }

    /**
     * Fetch Google Search Console data for a list of URLs
     * @param {string} accessToken 
     * @param {string} siteUrl (Property URL)
     * @param {string[]} urls 
     * @param {string} refreshToken (Optional) for auto-retry
     */
    static async fetchGscData(accessToken, siteUrl, urls, refreshToken = null) {
        if (!accessToken || !siteUrl || !urls.length) return {};

        const performFetch = async (token) => {
            return await undiciRequest(
                `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        endDate: new Date().toISOString().split('T')[0],
                        dimensions: ['page'],
                        rowLimit: 10000
                    })
                }
            );
        };

        try {
            let response = await performFetch(accessToken);

            // Handle token expiration
            if (response.statusCode === 401 && refreshToken) {
                console.log('[Integrations] GSC token expired, attempting refresh...');
                const newToken = await this.refreshAccessToken(refreshToken);
                if (newToken) {
                    accessToken = newToken;
                    response = await performFetch(newToken);
                }
            }

            if (response.statusCode !== 200) {
                const errBody = await response.body.json();
                console.error('GSC API Error:', errBody);
                return {};
            }

            const data = await response.body.json();
            const urlDataMap = {};

            if (data.rows) {
                data.rows.forEach(row => {
                    const pageUrl = row.keys[0];
                    urlDataMap[pageUrl] = {
                        gscClicks: row.clicks,
                        gscImpressions: row.impressions,
                        gscCtr: row.ctr,
                        gscPosition: row.position
                    };
                });
            }

            // If we refreshed the token, return it too so the caller can save it
            if (refreshToken && accessToken) {
                urlDataMap.__new_token = accessToken;
            }

            return urlDataMap;
        } catch (error) {
            console.error('Failed to fetch GSC data:', error);
            return {};
        }
    }

    /**
     * Fetch GA4 page-level metrics for crawled URLs
     * @param {string} accessToken
     * @param {string} propertyId
     * @param {string[]} urls
     * @param {string} refreshToken (Optional) for auto-retry
     */
    static async fetchGa4Data(accessToken, propertyId, urls, refreshToken = null) {
        if (!accessToken || !propertyId || !urls.length) return {};

        const performFetch = async (token) => {
            return await undiciRequest(
                `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
                        dimensions: [{ name: 'pagePathPlusQueryString' }],
                        metrics: [
                            { name: 'screenPageViews' },
                            { name: 'sessions' },
                            { name: 'totalUsers' },
                            { name: 'bounceRate' },
                            { name: 'averageSessionDuration' }
                        ],
                        limit: 100000
                    })
                }
            );
        };

        try {
            let response = await performFetch(accessToken);

            // Handle token expiration
            if (response.statusCode === 401 && refreshToken) {
                console.log('[Integrations] GA4 token expired, attempting refresh...');
                const newToken = await this.refreshAccessToken(refreshToken);
                if (newToken) {
                    accessToken = newToken;
                    response = await performFetch(newToken);
                }
            }

            if (response.statusCode !== 200) {
                const errBody = await response.body.json();
                console.error('GA4 API Error:', errBody);
                return {};
            }

            const data = await response.body.json();
            const ga4ByPath = {};

            for (const row of data.rows || []) {
                const pathKey = row.dimensionValues?.[0]?.value || '';
                if (!pathKey) continue;

                ga4ByPath[pathKey] = {
                    ga4Views: Number(row.metricValues?.[0]?.value || 0),
                    ga4Sessions: Number(row.metricValues?.[1]?.value || 0),
                    ga4Users: Number(row.metricValues?.[2]?.value || 0),
                    ga4BounceRate: Number(row.metricValues?.[3]?.value || 0),
                    ga4AvgSessionDuration: Number(row.metricValues?.[4]?.value || 0)
                };
            }

            const urlDataMap = {};
            for (const url of urls) {
                try {
                    const parsed = new URL(url);
                    const pathKey = `${parsed.pathname || '/'}${parsed.search || ''}`;
                    const fallbackPathKey = parsed.pathname || '/';
                    urlDataMap[url] = ga4ByPath[pathKey] || ga4ByPath[fallbackPathKey] || null;
                } catch {
                    urlDataMap[url] = null;
                }
            }

            if (refreshToken && accessToken) {
                urlDataMap.__new_token = accessToken;
            }

            return urlDataMap;
        } catch (error) {
            console.error('Failed to fetch GA4 data:', error);
            return {};
        }
    }


    /**
     * Fetch Bing Webmaster API data
     */
    static async fetchBingData(apiKey, siteUrl, urls) {
        // Bing uses a different API structure
        // Endpoint: /rest.svc/json/GetPageStats?siteUrl=...&apiKey=...
        // This is a placeholder for the actual Bing implementation logic
        return {};
    }

    /**
     * Fetch Ahrefs URL metrics
     */
    static async fetchAhrefsData(apiKey, url) {
        if (!apiKey) return null;
        try {
            // Ahrefs v3 API
            const response = await undiciRequest(
                `https://api.ahrefs.com/v3/public/url-rating?target=${encodeURIComponent(url)}`,
                {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                }
            );
            if (response.statusCode === 200) {
                return await response.body.json();
            }
        } catch (error) {
            console.error('Ahrefs fetch failed:', error);
        }
        return null;
    }

    /**
     * Fetch SEMrush URL metrics
     */
    static async fetchSemrushData(apiKey, url) {
        if (!apiKey) return null;
        try {
            // SEMrush API (usually based on domain/url)
            const response = await undiciRequest(
                `https://api.semrush.com/?type=url_organic&key=${apiKey}&display_limit=1&url=${encodeURIComponent(url)}&database=us`
            );
            if (response.statusCode === 200) {
                const text = await response.body.text();
                // SEMrush returns CSV-like text
                return text;
            }
        } catch (error) {
            console.error('SEMrush fetch failed:', error);
        }
        return null;
    }
}
