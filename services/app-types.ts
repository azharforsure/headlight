export type IndustryType = 'ecommerce' | 'local' | 'saas' | 'elearning';

export interface ProjectRecord {
  id: string;
  user_id: string;
  name: string;
  url: string;
  industry: IndustryType;
  created_at: string;
  // Crawler connection — auto-populated after each crawl
  domain?: string;
  last_crawl_at?: string;
  last_crawl_score?: number;
  last_crawl_grade?: string;
  crawl_count?: number;
  // Integration status flags
  gsc_connected?: boolean;
  ga4_connected?: boolean;
  // Auto-crawl scheduling
  auto_crawl_enabled?: boolean;
  auto_crawl_interval?: 'daily' | 'weekly' | 'monthly';
  notification_email?: string;
}
