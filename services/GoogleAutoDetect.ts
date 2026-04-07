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

async function fetchAllPaginated<T>(
  url: string,
  accessToken: string,
  listKey: string,
  pageSize: number
): Promise<T[]> {
  const items: T[] = [];
  let pageToken: string | undefined;

  do {
    const requestUrl = new URL(url);
    requestUrl.searchParams.set('pageSize', String(pageSize));
    if (pageToken) {
      requestUrl.searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(requestUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) break;

    const data = await response.json();
    items.push(...(data[listKey] || []));
    pageToken = data.nextPageToken || undefined;
  } while (pageToken);

  return items;
}

// ─── Auto-detect GA4 property for a domain ──────────
export async function detectGa4Property(
  accessToken: string,
  crawlDomain: string
): Promise<{ propertyId: string; propertyName: string } | null> {
  try {
    const accounts = await fetchAllPaginated<any>(
      'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
      accessToken,
      'accountSummaries',
      200
    );

    const domain = crawlDomain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    for (const account of accounts) {
      for (const prop of account.propertySummaries || []) {
        const propertyResource = prop.property; // "properties/123456789"

        const streams = await fetchAllPaginated<any>(
          `https://analyticsadmin.googleapis.com/v1beta/${propertyResource}/dataStreams`,
          accessToken,
          'dataStreams',
          200
        );

        for (const stream of streams) {
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
