// ─── Auto-detect GSC property for a domain ──────────
export async function detectGscProperty(
  accessToken: string,
  crawlDomain: string
): Promise<string | null> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/webmasters/v3/sites',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const sites: Array<{ siteUrl: string; permissionLevel: string }> =
      data.siteEntry || [];

    const domain = crawlDomain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    // Priority order for matching
    const candidates = [
      `sc-domain:${domain}`,
      `https://${domain}/`,
      `https://www.${domain}/`,
      `http://${domain}/`,
      `http://www.${domain}/`,
    ];

    for (const candidate of candidates) {
      const match = sites.find(
        (s) => s.siteUrl.toLowerCase() === candidate.toLowerCase()
      );
      if (match) return match.siteUrl;
    }

    // Fuzzy fallback
    const fuzzy = sites.find((s) =>
      s.siteUrl.toLowerCase().includes(domain.toLowerCase())
    );
    return fuzzy?.siteUrl || null;
  } catch {
    return null;
  }
}

// ─── Auto-detect GA4 property for a domain ──────────
export async function detectGa4Property(
  accessToken: string,
  crawlDomain: string
): Promise<{ propertyId: string; propertyName: string } | null> {
  try {
    const accountsRes = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!accountsRes.ok) return null;
    const accountsData = await accountsRes.json();
    const accounts = accountsData.accountSummaries || [];

    const domain = crawlDomain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    for (const account of accounts) {
      for (const prop of account.propertySummaries || []) {
        const propertyResource = prop.property; // "properties/123456789"

        const streamsRes = await fetch(
          `https://analyticsadmin.googleapis.com/v1beta/${propertyResource}/dataStreams`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!streamsRes.ok) continue;
        const streamsData = await streamsRes.json();

        for (const stream of streamsData.dataStreams || []) {
          if (stream.type !== 'WEB_DATA_STREAM') continue;
          const streamDomain = (stream.webStreamData?.defaultUri || '')
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '');

          if (streamDomain.toLowerCase() === domain.toLowerCase()) {
            return {
              propertyId: propertyResource.replace('properties/', ''),
              propertyName: prop.displayName || propertyResource,
            };
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Combined auto-detect ───────────────────────────
export async function autoDetectGoogleProperties(
  accessToken: string,
  crawlUrl: string
): Promise<{
  gscSiteUrl: string | null;
  ga4PropertyId: string | null;
  ga4PropertyName: string | null;
  domain: string;
}> {
  let domain: string;
  try {
    domain = new URL(crawlUrl).hostname.replace(/^www\./, '');
  } catch {
    domain = crawlUrl
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
  }

  const [gscSiteUrl, ga4Result] = await Promise.all([
    detectGscProperty(accessToken, domain),
    detectGa4Property(accessToken, domain),
  ]);

  return {
    gscSiteUrl,
    ga4PropertyId: ga4Result?.propertyId || null,
    ga4PropertyName: ga4Result?.propertyName || null,
    domain,
  };
}
