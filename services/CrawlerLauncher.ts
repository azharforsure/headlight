/**
 * CrawlerLauncher
 * Utility to open the crawler from various app views with specific targets.
 */

export type CrawlerTarget = 
  | { view: 'main'; mode?: string; industry?: string }
  | { view: 'page'; url: string; tab?: string }
  | { view: 'issue'; issueId: string }
  | { view: 'progress'; sessionId: string }
  | { view: 'config' }
  | { view: 'history'; sessionId?: string };

export function openCrawler(
  projectId: string | undefined, 
  target: CrawlerTarget, 
  options?: { newTab?: boolean }
) {
  if (!projectId) return;

  const params = new URLSearchParams();
  
  switch (target.view) {
    case 'main':
      if (target.mode) params.set('mode', target.mode);
      if (target.industry) params.set('industry', target.industry);
      break;
    case 'page':
      params.set('page', target.url);
      if (target.tab) params.set('tab', target.tab);
      break;
    case 'issue':
      params.set('issue', target.issueId);
      break;
    case 'progress':
      params.set('session', target.sessionId);
      params.set('view', 'progress');
      break;
    case 'config':
      params.set('view', 'config');
      break;
    case 'history':
      params.set('view', 'history');
      if (target.sessionId) params.set('session', target.sessionId);
      break;
  }
  
  const query = params.toString();
  const crawlerUrl = `/project/${projectId}/crawler${query ? `?${query}` : ''}`;
  
  if (options?.newTab) {
    window.open(crawlerUrl, '_blank');
  } else {
    // Open as full-screen overlay within app
    // We'll use a custom event that the MainLayout/App listens to
    window.dispatchEvent(new CustomEvent('headlight:open-crawler', { 
      detail: { url: crawlerUrl } 
    }));
  }
}
